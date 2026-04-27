const router = require('express').Router();

// Returns recent platform events for the notification bell.
// Polled every 8s from the frontend — intentionally lightweight.
router.get('/', async (req, res) => {
  const prisma = req.app.get('prisma');
  const since = new Date(Date.now() - 48 * 3600000); // last 48h

  const recentUsers = await prisma.user.findMany({
    where: { isAdmin: false, createdAt: { gte: since } },
    select: { id: true, email: true, businessName: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });

  const notifications = recentUsers.map(u => ({
    id: `reg_${u.id}`,
    type: u.status === 'PENDING_APPROVAL' ? 'pending' : 'approved',
    title: u.status === 'PENDING_APPROVAL' ? 'New registration' : 'User approved',
    message: `${u.businessName}`,
    sub: u.email,
    timestamp: u.createdAt,
    userId: u.id,
  }));

  res.json({ success: true, data: notifications });
});

module.exports = router;
