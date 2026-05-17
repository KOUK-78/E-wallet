const pool = require('../../config/db');

const HIGH_AMOUNT_THRESHOLD  = 50000;
const FREQ_WINDOW_SECONDS    = 60;
const FREQ_MAX_TRANSACTIONS  = 5;

/**
 * Returns true if the transaction should be flagged as suspicious.
 * Rules:
 *   1. Amount exceeds HIGH_AMOUNT_THRESHOLD
 *   2. Sender sent more than FREQ_MAX_TRANSACTIONS in last FREQ_WINDOW_SECONDS
 */
async function isFlagged(conn, senderId, amount) {
  if (Number(amount) > HIGH_AMOUNT_THRESHOLD) {
    return true;
  }

  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt
     FROM transactions
     WHERE sender_id = ?
       AND type IN ('debit')
       AND created_at >= NOW() - INTERVAL ? SECOND`,
    [senderId, FREQ_WINDOW_SECONDS]
  );

  if (rows[0].cnt >= FREQ_MAX_TRANSACTIONS) {
    return true;
  }

  return false;
}

module.exports = { isFlagged };
