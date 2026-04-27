const router = require('express').Router();
const cache = require('../../services/cache.service');

router.get('/subdistricts/:subDistrictId/villages', async (req, res) => {
  const subDistrictId = parseInt(req.params.subDistrictId, 10);
  if (isNaN(subDistrictId)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Invalid sub-district ID' } });
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  const prisma = req.app.get('prisma');
  const [villages, total] = await Promise.all([
    prisma.village.findMany({
      where: { subDistrictId },
      select: { id: true, code: true, name: true, subDistrictId: true },
      orderBy: { name: 'asc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.village.count({ where: { subDistrictId } }),
  ]);

  res.json({
    success: true,
    count: villages.length,
    total,
    data: villages,
    meta: { page, limit },
  });
});

module.exports = router;
