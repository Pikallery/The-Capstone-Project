const router = require('express').Router();
const cache = require('../../services/cache.service');

function buildAddress(v) {
  return {
    value: `village_id_${v.id}`,
    label: v.name,
    fullAddress: `${v.name}, ${v.subDistrict.name}, ${v.subDistrict.district.name}, ${v.subDistrict.district.state.name}, India`,
    hierarchy: {
      villageId: v.id,
      village: v.name,
      villageCode: v.code,
      subDistrictId: v.subDistrict.id,
      subDistrict: v.subDistrict.name,
      districtId: v.subDistrict.district.id,
      district: v.subDistrict.district.name,
      stateId: v.subDistrict.district.state.id,
      state: v.subDistrict.district.state.name,
      country: 'India',
    },
  };
}

router.get('/search', async (req, res) => {
  const { q, state, district, subDistrict, limit = '25', page = '1' } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Query must be at least 2 characters' } });
  }

  const take = Math.min(parseInt(limit, 10) || 25, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
  const prisma = req.app.get('prisma');

  const user = req.apiUser;
  const allowedStateIds = user.stateAccess.map(a => a.stateId);

  const where = {
    name: { contains: q.trim(), mode: 'insensitive' },
  };

  if (allowedStateIds.length > 0) {
    where.subDistrict = {
      district: {
        stateId: { in: allowedStateIds },
      },
    };
  }

  if (state) {
    const stateWhere = where.subDistrict?.district || {};
    stateWhere.state = { name: { contains: state, mode: 'insensitive' } };
    where.subDistrict = { district: { ...stateWhere } };
  }

  if (district) {
    const sd = where.subDistrict || {};
    sd.district = { ...(sd.district || {}), name: { contains: district, mode: 'insensitive' } };
    where.subDistrict = sd;
  }

  if (subDistrict) {
    const sd = where.subDistrict || {};
    sd.name = { contains: subDistrict, mode: 'insensitive' };
    where.subDistrict = sd;
  }

  const start = Date.now();
  const [villages, total] = await Promise.all([
    prisma.village.findMany({
      where,
      take,
      skip,
      include: {
        subDistrict: {
          include: {
            district: { include: { state: true } },
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
    data: villages.map(buildAddress),
    meta: {
      responseTime: Date.now() - start,
      page: parseInt(page, 10) || 1,
      limit: take,
      rateLimit: {
        remaining: parseInt(res.getHeader('X-RateLimit-Remaining'), 10) || 0,
        limit: parseInt(res.getHeader('X-RateLimit-Limit'), 10) || 0,
        reset: res.getHeader('X-RateLimit-Reset'),
      },
    },
  });
});

module.exports = router;
