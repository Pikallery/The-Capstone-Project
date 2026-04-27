const router = require('express').Router();

// States list
router.get('/states', async (req, res) => {
  const prisma = req.app.get('prisma');
  const states = await prisma.state.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } });
  res.json({ success: true, data: states });
});

// Districts by state
router.get('/states/:stateId/districts', async (req, res) => {
  const prisma = req.app.get('prisma');
  const districts = await prisma.district.findMany({
    where: { stateId: Number(req.params.stateId) },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });
  res.json({ success: true, data: districts });
});

// Sub-districts by district
router.get('/districts/:districtId/subdistricts', async (req, res) => {
  const prisma = req.app.get('prisma');
  const subDistricts = await prisma.subDistrict.findMany({
    where: { districtId: Number(req.params.districtId) },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });
  res.json({ success: true, data: subDistricts });
});

module.exports = router;
