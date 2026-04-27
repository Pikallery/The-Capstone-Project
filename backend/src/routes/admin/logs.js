const router = require('express').Router();

router.get('/', async (req, res) => {
  const { userId, endpoint, statusCode, from, to, minResponseTime, page = '1', limit = '50' } = req.query;
  const take = Math.min(parseInt(limit, 10) || 50, 200);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
  const prisma = req.app.get('prisma');

  const where = {};
  if (userId) where.userId = parseInt(userId, 10);
  if (endpoint) where.endpoint = { contains: endpoint, mode: 'insensitive' };
  if (statusCode) {
    const code = parseInt(statusCode, 10);
    if (statusCode === '2xx') where.statusCode = { gte: 200, lt: 300 };
    else if (statusCode === '4xx') where.statusCode = { gte: 400, lt: 500 };
    else if (statusCode === '5xx') where.statusCode = { gte: 500 };
    else where.statusCode = code;
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (minResponseTime) where.responseTime = { gte: parseInt(minResponseTime, 10) };

  const [logs, total] = await Promise.all([
    prisma.apiLog.findMany({
      where,
      take,
      skip,
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        responseTime: true,
        ipAddress: true,
        createdAt: true,
        apiKey: { select: { key: true, name: true } },
        user: { select: { id: true, businessName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.apiLog.count({ where }),
  ]);

  const masked = logs.map(l => ({
    ...l,
    apiKey: l.apiKey ? { ...l.apiKey, key: l.apiKey.key.slice(0, 8) + '****' } : null,
    ipAddress: l.ipAddress ? l.ipAddress.replace(/\.\d+$/, '.***') : null,
  }));

  res.json({ success: true, count: masked.length, total, data: masked, meta: { page: parseInt(page, 10), limit: take } });
});

module.exports = router;
