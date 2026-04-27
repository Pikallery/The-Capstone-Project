const router = require('express').Router();
const { PLAN_LIMITS } = require('../../middleware/auth');

router.get('/summary', async (req, res) => {
  const prisma = req.app.get('prisma');
  const userId = req.jwtUser.userId;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { planType: true } });
  const limits = PLAN_LIMITS[user.planType] || PLAN_LIMITS.FREE;

  const [todayCount, monthCount, successCount, totalCount, avgTime] = await Promise.all([
    prisma.apiLog.count({ where: { userId, createdAt: { gte: todayStart } } }),
    prisma.apiLog.count({ where: { userId, createdAt: { gte: monthStart } } }),
    prisma.apiLog.count({ where: { userId, statusCode: { lt: 400 }, createdAt: { gte: todayStart } } }),
    prisma.apiLog.count({ where: { userId, createdAt: { gte: todayStart } } }),
    prisma.apiLog.aggregate({
      _avg: { responseTime: true },
      where: { userId, createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
  ]);

  res.json({
    success: true,
    data: {
      planType: user.planType,
      limits,
      today: {
        requests: todayCount,
        remaining: Math.max(0, limits.daily - todayCount),
        successRate: totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '100.0',
      },
      thisMonth: { requests: monthCount },
      avgResponseTime: Math.round(avgTime._avg.responseTime || 0),
    },
  });
});

router.get('/history', async (req, res) => {
  const { days = '7' } = req.query;
  const numDays = Math.min(parseInt(days, 10) || 7, 30);
  const prisma = req.app.get('prisma');
  const userId = req.jwtUser.userId;
  const since = new Date(Date.now() - numDays * 86400000);

  const logs = await prisma.apiLog.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true, endpoint: true, statusCode: true },
    orderBy: { createdAt: 'asc' },
  });

  const byDay = {};
  for (const log of logs) {
    const day = log.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, total: 0, success: 0, byEndpoint: {} };
    byDay[day].total++;
    if (log.statusCode < 400) byDay[day].success++;
    byDay[day].byEndpoint[log.endpoint] = (byDay[day].byEndpoint[log.endpoint] || 0) + 1;
  }

  res.json({ success: true, data: Object.values(byDay) });
});

module.exports = router;
