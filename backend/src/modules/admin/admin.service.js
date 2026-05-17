const pool = require('../../config/db');

async function getUsers() {
  const [rows] = await pool.query(`
    SELECT u.id, u.name, u.email, u.role, u.is_frozen, u.created_at, w.balance
    FROM users u
    JOIN wallets w ON u.id = w.user_id
    ORDER BY u.created_at DESC
  `);
  return rows;
}

async function toggleFreeze(userId) {
  const [rows] = await pool.query('SELECT is_frozen FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) throw Object.assign(new Error('User not found'), { status: 404 });
  
  const currentStatus = rows[0].is_frozen;
  const newStatus = currentStatus ? 0 : 1;
  
  await pool.query('UPDATE users SET is_frozen = ? WHERE id = ?', [newStatus, userId]);
  
  return { id: userId, is_frozen: newStatus };
}

async function getStats() {
  const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM users');
  const [[{ total_volume }]] = await pool.query("SELECT SUM(amount) as total_volume FROM transactions WHERE type = 'debit'");
  const [[{ fraud_flags }]] = await pool.query('SELECT COUNT(*) as fraud_flags FROM transactions WHERE flagged = 1');
  
  return {
    total_users,
    total_volume: total_volume || 0,
    fraud_flags
  };
}

module.exports = { getUsers, toggleFreeze, getStats };
