const pool = require('../../config/db');

/**
 * Get wallet balance for a user.
 */
async function getBalance(userId) {
  const [rows] = await pool.query(
    'SELECT balance FROM wallets WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }
  return { balance: rows[0].balance };
}

/**
 * Top-up wallet (simulated deposit).
 * Records a topup transaction and updates balance atomically.
 */
async function topUp(userId, amount) {
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    const err = new Error('Amount must be a positive number');
    err.status = 400;
    throw err;
  }

  const numAmount = Number(amount);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [numAmount, userId]
    );

    // Record the top-up as a transaction (sender = receiver = user for topup)
    await conn.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount, status, type, flagged)
       VALUES (?, ?, ?, 'success', 'topup', false)`,
      [userId, userId, numAmount]
    );

    const [rows] = await conn.query(
      'SELECT balance FROM wallets WHERE user_id = ?',
      [userId]
    );

    await conn.commit();
    return { balance: rows[0].balance };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getBalance, topUp };
