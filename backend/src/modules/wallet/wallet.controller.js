const walletService = require('./wallet.service');

async function getBalance(req, res, next) {
  try {
    const data = await walletService.getBalance(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function topUp(req, res, next) {
  try {
    const data = await walletService.topUp(req.user.id, req.body.amount);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getBalance, topUp };
