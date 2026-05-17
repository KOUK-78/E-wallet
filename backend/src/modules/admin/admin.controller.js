const adminService = require('./admin.service');

async function getUsers(req, res, next) {
  try {
    const data = await adminService.getUsers();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function toggleFreeze(req, res, next) {
  try {
    const data = await adminService.toggleFreeze(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    const data = await adminService.getStats();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, toggleFreeze, stats };
