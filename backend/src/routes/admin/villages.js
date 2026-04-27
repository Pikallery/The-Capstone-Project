const router = require('express').Router();

router.get('/', async (req, res) => {
  const { stateId, districtId, subDistrictId, search, page = '1', limit = '500' } = req.query;

  if (!stateId && !search) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'stateId or search query required' } });
  }

  const take = Math.min(parseInt(limit, 10) || 500, 10000);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
  const prisma = req.app.get('prisma');

  const where = {};

  if (subDistrictId) {
    where.subDistrictId = parseInt(subDistrictId, 10);
  } else if (districtId) {
    where.subDistrict = { districtId: parseInt(districtId, 10) };
  } else if (stateId) {
    where.subDistrict = { district: { stateId: parseInt(stateId, 10) } };
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [villages, total] = await Promise.all([
    prisma.village.findMany({
      where,
      take,
      skip,
      select: {
        id: true,
        code: true,
        name: true,
        subDistrict: {
          select: {
            name: true,
            district: { select: { name: true, state: { select: { name: true } } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.village.count({ where }),
  ]);

  res.json({
    success: true,
    count: villages.length,
    total,
    data: villages.map(v => ({
      id: v.id,
      code: v.code,
      name: v.name,
      subDistrict: v.subDistrict.name,
      district: v.subDistrict.district.name,
      state: v.subDistrict.district.state.name,
    })),
    meta: { page: parseInt(page, 10), limit: take },
  });
});

module.exports = router;
