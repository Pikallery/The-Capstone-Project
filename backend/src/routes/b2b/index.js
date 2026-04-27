const router = require('express').Router();
const { requireJwt } = require('../../middleware/auth');

router.use(requireJwt());

router.use('/keys', require('./keys'));
router.use('/usage', require('./usage'));

module.exports = router;
