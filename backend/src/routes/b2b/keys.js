const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateKey(prefix) {
  return prefix + crypto.randomBytes(16).toString('hex');
}

router.get('/', async (req, res) => {
  const prisma = req.app.get('prisma');
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.jwtUser.userId },
    select: {
      id: true,
      name: true,
      key: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const masked = keys.map(k => ({
    ...k,
    key: k.key.slice(0, 8) + '****' + k.key.slice(-4),
  }));

  res.json({ success: true, count: masked.length, data: masked });
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Key name required (min 2 chars)' } });
  }

  const prisma = req.app.get('prisma');
  const existing = await prisma.apiKey.count({ where: { userId: req.jwtUser.userId, isActive: true } });
  if (existing >= 5) {
    return res.status(400).json({ success: false, error: { code: 'LIMIT_REACHED', message: 'Maximum 5 active API keys allowed' } });
  }

  const rawKey = generateKey('ak_');
  const rawSecret = generateKey('as_');
  const secretHash = await bcrypt.hash(rawSecret, 10);

  const apiKey = await prisma.apiKey.create({
    data: { name: name.trim(), key: rawKey, secretHash, userId: req.jwtUser.userId },
  });

  res.status(201).json({
    success: true,
    data: {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      secret: rawSecret,
      warning: 'Store the secret securely — it will never be shown again.',
    },
  });
});

router.delete('/:id', async (req, res) => {
  const prisma = req.app.get('prisma');
  const key = await prisma.apiKey.findFirst({
    where: { id: parseInt(req.params.id, 10), userId: req.jwtUser.userId },
  });

  if (!key) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } });

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { isActive: false },
  });

  res.json({ success: true, data: { message: 'API key revoked' } });
});

router.post('/:id/regenerate-secret', async (req, res) => {
  const prisma = req.app.get('prisma');
  const key = await prisma.apiKey.findFirst({
    where: { id: parseInt(req.params.id, 10), userId: req.jwtUser.userId },
  });

  if (!key) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } });

  const rawSecret = generateKey('as_');
  const secretHash = await bcrypt.hash(rawSecret, 10);

  await prisma.apiKey.update({ where: { id: key.id }, data: { secretHash } });

  res.json({
    success: true,
    data: {
      secret: rawSecret,
      warning: 'Previous secret is now invalid. Store the new secret securely.',
    },
  });
});

module.exports = router;
