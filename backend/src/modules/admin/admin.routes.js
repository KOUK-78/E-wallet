const router = require('express').Router();
const ctrl = require('./admin.controller');
const authenticate = require('../../middleware/authenticate');
const requireAdmin = require('../../middleware/requireAdmin');

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', ctrl.getUsers);
router.post('/users/:id/freeze', ctrl.toggleFreeze);
router.get('/stats', ctrl.stats);

module.exports = router;
