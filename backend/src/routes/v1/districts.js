const router = require('express').Router();
const cache = require('../../services/cache.service');

router.get('/states/:stateId/districts', async (req, res) => {
  const stateId = parseInt(req.params.stateId, 10);
  if (isNaN(stateId)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Invalid state ID' } });
  }

  const cacheKey = `v1:districts:${stateId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const prisma = req.app.get('prisma');
  const districts = await prisma.district.findMany({
    where: { stateId },
    select: { id: true, code: true, name: true, stateId: true },
    orderBy: { name: 'asc' },
  });

  const response = { success: true, count: districts.length, data: districts };
  await cache.set(cacheKey, response, 43200);
  res.json(response);
});

router.get('/districts/:districtId/subdistricts', async (req, res) => {
  const districtId = parseInt(req.params.districtId, 10);
  if (isNaN(districtId)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Invalid district ID' } });
  }

  const cacheKey = `v1:subdistricts:${districtId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const prisma = req.app.get('prisma');
  const subDistricts = await prisma.subDistrict.findMany({
    where: { districtId },
    select: { id: true, code: true, name: true, districtId: true },
    orderBy: { name: 'asc' },
  });

  const response = { success: true, count: subDistricts.length, data: subDistricts };
  await cache.set(cacheKey, response, 43200);
  res.json(response);
});

module.exports = router;
