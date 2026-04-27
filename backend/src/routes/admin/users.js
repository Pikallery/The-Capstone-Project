const router = require('express').Router();
const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
  const { status, planType, search, page = '1', limit = '20' } = req.query;
  const prisma = req.app.get('prisma');
  const take = Math.min(parseInt(limit, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where = { isAdmin: false };
  if (status) where.status = status;
  if (planType) where.planType = planType;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, businessName: true, planType: true,
        status: true, phone: true, gstNumber: true, createdAt: true,
        _count: { select: { apiKeys: true, logs: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, count: users.length, total, data: users, meta: { page: parseInt(page, 10), limit: take } });
});

router.get('/:id', async (req, res) => {
  const prisma = req.app.get('prisma');
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id, 10) },
    include: {
      apiKeys: { select: { id: true, name: true, key: true, isActive: true, createdAt: true, lastUsedAt: true } },
      stateAccess: { include: { state: { select: { id: true, name: true } } } },
    },
  });
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Invalid status' } });
  }

  const prisma = req.app.get('prisma');
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id, 10) },
    data: { status },
    select: { id: true, email: true, status: true, planType: true },
  });
  res.json({ success: true, data: user });
});

router.patch('/:id/plan', async (req, res) => {
  const { planType } = req.body;
  const validPlans = ['FREE', 'PREMIUM', 'PRO', 'UNLIMITED'];
  if (!validPlans.includes(planType)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Invalid plan type' } });
  }

  const prisma = req.app.get('prisma');
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id, 10) },
    data: { planType },
    select: { id: true, email: true, status: true, planType: true },
  });
  res.json({ success: true, data: user });
});

router.post('/:id/state-access', async (req, res) => {
  const { stateIds, grantAll } = req.body;
  const userId = parseInt(req.params.id, 10);
  const prisma = req.app.get('prisma');

  await prisma.userStateAccess.deleteMany({ where: { userId } });

  let ids = [];
  if (grantAll) {
    const states = await prisma.state.findMany({ select: { id: true } });
    ids = states.map(s => s.id);
  } else if (Array.isArray(stateIds)) {
    ids = stateIds.map(Number).filter(Boolean);
  }

  if (ids.length > 0) {
    await prisma.userStateAccess.createMany({
      data: ids.map(stateId => ({ userId, stateId })),
      skipDuplicates: true,
    });
  }

  res.json({ success: true, data: { userId, statesGranted: ids.length } });
});

router.patch('/:id/notes', async (req, res) => {
  const { notes } = req.body;
  const prisma = req.app.get('prisma');
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id, 10) },
    data: { notes },
    select: { id: true, notes: true },
  });
  res.json({ success: true, data: user });
});

module.exports = router;
