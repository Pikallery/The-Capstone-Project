const router = require('express').Router();

router.get('/overview', async (req, res) => {
  const prisma = req.app.get('prisma');
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart - 86400000);

  const [
    totalVillages,
    totalUsers,
    activeUsers,
    todayRequests,
    yesterdayRequests,
    avgResponseTime,
    planDistribution,
  ] = await Promise.all([
    prisma.village.count(),
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.user.count({ where: { isAdmin: false, status: 'ACTIVE' } }),
    prisma.apiLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.apiLog.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.apiLog.aggregate({ _avg: { responseTime: true }, where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    prisma.user.groupBy({ by: ['planType'], _count: { id: true }, where: { isAdmin: false } }),
  ]);

  res.json({
    success: true,
    data: {
      totalVillages,
      totalUsers,
      activeUsers,
      todayRequests,
      yesterdayRequests,
      requestGrowth: yesterdayRequests > 0 ? ((todayRequests - yesterdayRequests) / yesterdayRequests * 100).toFixed(1) : null,
      avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
      planDistribution: planDistribution.map(p => ({ plan: p.planType, count: p._count.id })),
    },
  });
});

router.get('/requests-over-time', async (req, res) => {
  const { days = '30' } = req.query;
  const numDays = Math.min(parseInt(days, 10) || 30, 90);
  const prisma = req.app.get('prisma');
  const since = new Date(Date.now() - numDays * 86400000);

  const logs = await prisma.apiLog.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, statusCode: true },
    orderBy: { createdAt: 'asc' },
  });

  const byDay = {};
  for (const log of logs) {
    const day = log.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, total: 0, success: 0, error: 0 };
    byDay[day].total++;
    if (log.statusCode < 400) byDay[day].success++;
    else byDay[day].error++;
  }

  res.json({ success: true, data: Object.values(byDay) });
});

router.get('/top-states', async (req, res) => {
  const prisma = req.app.get('prisma');
  const states = await prisma.state.findMany({
    select: {
      name: true,
      _count: { select: { districts: true } },
      districts: {
        select: {
          _count: { select: { subDistricts: true } },
          subDistricts: { select: { _count: { select: { villages: true } } } },
        },
      },
    },
    take: 10,
  });

  const result = await prisma.$queryRaw`
    SELECT s.name, COUNT(v.id)::int as village_count
    FROM "State" s
    JOIN "District" d ON d."stateId" = s.id
    JOIN "SubDistrict" sd ON sd."districtId" = d.id
    JOIN "Village" v ON v."subDistrictId" = sd.id
    GROUP BY s.id, s.name
    ORDER BY village_count DESC
    LIMIT 10
  `;

  res.json({ success: true, data: result });
});

router.get('/response-time-trend', async (req, res) => {
  const prisma = req.app.get('prisma');
  const since = new Date(Date.now() - 24 * 3600000);

  const logs = await prisma.apiLog.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, responseTime: true },
    orderBy: { createdAt: 'asc' },
  });

  const byHour = {};
  for (const log of logs) {
    const hour = log.createdAt.toISOString().slice(0, 13);
    if (!byHour[hour]) byHour[hour] = { hour, times: [] };
    byHour[hour].times.push(log.responseTime);
  }

  const data = Object.values(byHour).map(h => {
    const sorted = h.times.sort((a, b) => a - b);
    const p95idx = Math.floor(sorted.length * 0.95);
    const p99idx = Math.floor(sorted.length * 0.99);
    return {
      hour: h.hour,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[p95idx] || 0,
      p99: sorted[p99idx] || 0,
      count: sorted.length,
    };
  });

  res.json({ success: true, data });
});

router.get('/endpoint-breakdown', async (req, res) => {
  const prisma = req.app.get('prisma');
  const since = new Date(Date.now() - 24 * 3600000);

  const result = await prisma.apiLog.groupBy({
    by: ['endpoint'],
    _count: { id: true },
    _avg: { responseTime: true },
    where: { createdAt: { gte: since } },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  res.json({
    success: true,
    data: result.map(r => ({
      endpoint: r.endpoint,
      count: r._count.id,
      avgResponseTime: Math.round(r._avg.responseTime || 0),
    })),
  });
});

module.exports = router;
