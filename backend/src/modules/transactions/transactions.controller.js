const txService = require('./transactions.service');

async function send(req, res, next) {
  try {
    const data = await txService.sendMoney(req.user.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const data = await txService.getHistory(req.user.id, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function analytics(req, res, next) {
  try {
    const data = await txService.getAnalytics(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { send, history, analytics };
