const router       = require('express').Router();
const ctrl         = require('./wallet.controller');
const authenticate = require('../../middleware/authenticate');

router.get('/balance', authenticate, ctrl.getBalance);
router.post('/topup',  authenticate, ctrl.topUp);

module.exports = router;
