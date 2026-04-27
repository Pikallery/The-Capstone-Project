const router = require('express').Router();
const cache = require('../../services/cache.service');

router.get('/states', async (req, res) => {
  const cached = await cache.get('v1:states');
  if (cached) return res.json(cached);

  const prisma = req.app.get('prisma');
  const states = await prisma.state.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  });

  const response = { success: true, count: states.length, data: states };
  await cache.set('v1:states', response, 86400);
  res.json(response);
});

module.exports = router;
