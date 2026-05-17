const pool = require('../../config/db');

async function search(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const like = `%${q.trim()}%`;
    const [rows] = await pool.query(
      `SELECT id, name, email, phone
       FROM users
       WHERE name LIKE ? OR email = ? OR phone = ?
       LIMIT 10`,
      [like, q.trim(), q.trim()]
    );

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
