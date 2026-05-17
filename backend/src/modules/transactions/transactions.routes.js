const router       = require('express').Router();
const ctrl         = require('./transactions.controller');
const authenticate = require('../../middleware/authenticate');

router.post('/send',    authenticate, ctrl.send);
router.get('/history',  authenticate, ctrl.history);

module.exports = router;
