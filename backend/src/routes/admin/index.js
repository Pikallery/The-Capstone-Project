const router = require('express').Router();
const { requireJwt } = require('../../middleware/auth');

router.use(requireJwt(true));

router.use('/users', require('./users'));
router.use('/analytics', require('./analytics'));
router.use('/villages', require('./villages'));
router.use('/logs', require('./logs'));
router.use('/', require('./geo'));
router.use('/notifications', require('./notifications'));

module.exports = router;
