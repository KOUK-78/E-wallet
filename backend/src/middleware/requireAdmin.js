const pool = require('../config/db');

async function requireAdmin(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0 || rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAdmin;
