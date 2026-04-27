const router = require('express').Router();
const cache = require('../../services/cache.service');

router.get('/autocomplete', async (req, res) => {
  const { q, hierarchyLevel = 'village', limit = '10' } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Query must be at least 2 characters' } });
  }

  const take = Math.min(parseInt(limit, 10) || 10, 20);
  const search = q.trim();
  const prisma = req.app.get('prisma');
  const user = req.apiUser;
  const allowedStateIds = user.stateAccess.map(a => a.stateId);
  const start = Date.now();

  const cacheKey = `v1:autocomplete:${search}:${hierarchyLevel}:${allowedStateIds.sort().join(',')}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  let data = [];

  if (hierarchyLevel === 'village' || hierarchyLevel === 'all') {
    const stateFilter = allowedStateIds.length > 0
      ? { subDistrict: { district: { stateId: { in: allowedStateIds } } } }
      : {};

    const villages = await prisma.village.findMany({
      where: { name: { startsWith: search, mode: 'insensitive' }, ...stateFilter },
      take,
      include: {
        subDistrict: { include: { district: { include: { state: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    data = villages.map(v => ({
      type: 'village',
      value: `village_${v.id}`,
      label: v.name,
      display: `${v.name} (${v.subDistrict.name}, ${v.subDistrict.district.name}, ${v.subDistrict.district.state.name})`,
      fullAddress: `${v.name}, ${v.subDistrict.name}, ${v.subDistrict.district.name}, ${v.subDistrict.district.state.name}, India`,
      hierarchy: {
        villageId: v.id,
        village: v.name,
        subDistrictId: v.subDistrict.id,
        subDistrict: v.subDistrict.name,
        districtId: v.subDistrict.district.id,
        district: v.subDistrict.district.name,
        stateId: v.subDistrict.district.state.id,
        state: v.subDistrict.district.state.name,
        country: 'India',
      },
    }));
  } else if (hierarchyLevel === 'state') {
    const states = await prisma.state.findMany({
      where: { name: { startsWith: search, mode: 'insensitive' } },
      take,
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    data = states.map(s => ({ type: 'state', value: `state_${s.id}`, label: s.name, display: s.name }));
  } else if (hierarchyLevel === 'district') {
    const districts = await prisma.district.findMany({
      where: { name: { startsWith: search, mode: 'insensitive' } },
      take,
      include: { state: true },
      orderBy: { name: 'asc' },
    });
    data = districts.map(d => ({
      type: 'district', value: `district_${d.id}`, label: d.name,
      display: `${d.name}, ${d.state.name}`,
    }));
  }

  const response = { success: true, count: data.length, data, meta: { responseTime: Date.now() - start } };
  await cache.set(cacheKey, response, 300);
  res.json(response);
});

module.exports = router;
