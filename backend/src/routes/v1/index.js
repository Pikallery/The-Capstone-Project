const router = require('express').Router();
const { requireApiKey, logApiRequest } = require('../../middleware/auth');

router.use(requireApiKey);
router.use(logApiRequest);

router.use('/', require('./search'));
router.use('/', require('./states'));
router.use('/', require('./districts'));
router.use('/', require('./subdistricts'));
router.use('/', require('./autocomplete'));

module.exports = router;
