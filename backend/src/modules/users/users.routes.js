const router       = require('express').Router();
const ctrl         = require('./users.controller');
const authenticate = require('../../middleware/authenticate');

router.get('/search', authenticate, ctrl.search);

module.exports = router;
