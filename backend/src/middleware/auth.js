const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cache = require('../services/cache.service');

const PLAN_LIMITS = {
  FREE:      { daily: 5000,     burst: 100  },
  PREMIUM:   { daily: 50000,    burst: 500  },
  PRO:       { daily: 300000,   burst: 2000 },
  UNLIMITED: { daily: 1000000,  burst: 5000 },
};

function requireJwt(adminOnly = false) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'JWT token required' } });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.jwtUser = payload;
      if (adminOnly && !payload.isAdmin) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      }
      next();
    } catch {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
    }
  };
}

async function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_API_KEY', message: 'X-API-Key header required' } });
  }

  const prisma = req.app.get('prisma');
  const start = Date.now();

  // Cache lookup to avoid hitting DB on every request
  let keyRecord = await cache.get(`apikey:${apiKey}`);
  if (!keyRecord) {
    keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          include: { stateAccess: { include: { state: true } } },
        },
      },
    });
    if (keyRecord) {
      await cache.set(`apikey:${apiKey}`, keyRecord, 300); // 5 min cache
    }
  }

  if (!keyRecord || !keyRecord.isActive) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } });
  }

  if (keyRecord.user.status !== 'ACTIVE') {
    return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Account not active' } });
  }

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return res.status(401).json({ success: false, error: { code: 'KEY_EXPIRED', message: 'API key has expired' } });
  }

  const plan = PLAN_LIMITS[keyRecord.user.planType] || PLAN_LIMITS.FREE;
  const today = new Date().toISOString().slice(0, 10);
  const rateLimitKey = `ratelimit:${apiKey}:${today}`;

  const currentCount = await cache.incr(rateLimitKey, 86400);
  if (currentCount > plan.daily) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Daily quota exceeded' },
    });
  }

  const resetTime = new Date();
  resetTime.setUTCHours(24, 0, 0, 0);

  res.set('X-RateLimit-Limit', plan.daily);
  res.set('X-RateLimit-Remaining', Math.max(0, plan.daily - currentCount));
  res.set('X-RateLimit-Reset', resetTime.toISOString());

  req.apiKeyRecord = keyRecord;
  req.apiUser = keyRecord.user;
  req.planLimits = plan;
  req.requestStart = start;

  next();
}

function logApiRequest(req, res, next) {
  const prisma = req.app.get('prisma');
  const origJson = res.json.bind(res);

  res.json = function (body) {
    const responseTime = req.requestStart ? Date.now() - req.requestStart : 0;
    if (req.apiKeyRecord) {
      setImmediate(() => {
        prisma.apiLog.create({
          data: {
            apiKeyId: req.apiKeyRecord.id,
            userId: req.apiUser?.id,
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime,
            ipAddress: (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim().slice(0, 45),
            userAgent: (req.headers['user-agent'] || '').slice(0, 255),
            query: req.query.q ? req.query.q.slice(0, 255) : null,
          },
        }).catch(() => {});
      });
    }
    return origJson(body);
  };

  next();
}

module.exports = { requireJwt, requireApiKey, logApiRequest, PLAN_LIMITS };
