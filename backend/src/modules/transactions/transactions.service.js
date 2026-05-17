const pool        = require('../../config/db');
const fraudService = require('../fraud/fraud.service');

/**
 * Send money from one user to another.
 * Uses a DB transaction with SELECT ... FOR UPDATE to prevent double-spend.
 */
async function sendMoney(senderId, { recipientEmail, recipientPhone, amount, note }) {
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    const err = new Error('Amount must be a positive number');
    err.status = 400;
    throw err;
  }

  const numAmount = Number(amount);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Find recipient
    const [recipients] = await conn.query(
      'SELECT id, email FROM users WHERE email = ? OR phone = ?',
      [recipientEmail || null, recipientPhone || null]
    );
    if (recipients.length === 0) {
      const err = new Error('Recipient not found');
      err.status = 404;
      throw err;
    }
    const receiverId = recipients[0].id;

    // 2. Prevent self-transfer
    if (receiverId === senderId) {
      const err = new Error('Cannot send money to yourself');
      err.status = 400;
      throw err;
    }

    // 3. Lock both wallet rows (order by id to prevent deadlock)
    const sortedIds = [senderId, receiverId].sort((a, b) => a - b);

    await conn.query(
      'SELECT balance FROM wallets WHERE user_id IN (?, ?) FOR UPDATE',
      sortedIds
    );

    // 4. Read sender balance
    const [senderWallet] = await conn.query(
      'SELECT balance FROM wallets WHERE user_id = ?',
      [senderId]
    );
    const senderBalance = parseFloat(senderWallet[0].balance);

    if (senderBalance < numAmount) {
      const err = new Error('Insufficient balance');
      err.status = 422;
      throw err;
    }

    // 5. Check fraud
    const flagged = await fraudService.isFlagged(conn, senderId, numAmount);

    // 6. Deduct from sender
    await conn.query(
      'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
      [numAmount, senderId]
    );

    // 7. Credit receiver
    await conn.query(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [numAmount, receiverId]
    );

    // 8. Insert debit row for sender
    const [debitResult] = await conn.query(
      `INSERT INTO transactions
         (sender_id, receiver_id, amount, status, type, flagged, note)
       VALUES (?, ?, ?, 'success', 'debit', ?, ?)`,
      [senderId, receiverId, numAmount, flagged, note || null]
    );

    // 9. Insert credit row for receiver
    await conn.query(
      `INSERT INTO transactions
         (sender_id, receiver_id, amount, status, type, flagged, note)
       VALUES (?, ?, ?, 'success', 'credit', ?, ?)`,
      [senderId, receiverId, numAmount, flagged, note || null]
    );

    await conn.commit();

    return {
      message: 'Transfer successful',
      transactionId: debitResult.insertId,
      amount: numAmount,
      flagged,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Fetch paginated transaction history for a user.
 * Filters: type, from, to (date), minAmount, maxAmount, page, limit
 */
async function getHistory(userId, filters = {}) {
  const {
    type,
    from,
    to,
    minAmount,
    maxAmount,
    page  = 1,
    limit = 10,
  } = filters;

  const conditions = [
    '(t.sender_id = ? OR t.receiver_id = ?)',
  ];
  const params = [userId, userId];

  // For the user's perspective: debit/credit rows where they are the actor
  if (type === 'debit') {
    conditions.push("t.type = 'debit' AND t.sender_id = ?");
    params.push(userId);
  } else if (type === 'credit') {
    conditions.push("t.type = 'credit' AND t.receiver_id = ?");
    params.push(userId);
  } else if (type === 'topup') {
    conditions.push("t.type = 'topup' AND t.sender_id = ?");
    params.push(userId);
  }

  if (from) {
    conditions.push('t.created_at >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('t.created_at <= ?');
    params.push(to);
  }
  if (minAmount) {
    conditions.push('t.amount >= ?');
    params.push(Number(minAmount));
  }
  if (maxAmount) {
    conditions.push('t.amount <= ?');
    params.push(Number(maxAmount));
  }

  const pageNum  = Math.max(1, parseInt(page, 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset   = (pageNum - 1) * pageSize;

  const where = conditions.join(' AND ');

  const [rows] = await pool.query(
    `SELECT
       t.id, t.amount, t.status, t.type, t.flagged, t.note, t.created_at,
       s.name AS sender_name,   s.email AS sender_email,
       r.name AS receiver_name, r.email AS receiver_email
     FROM transactions t
     JOIN users s ON s.id = t.sender_id
     JOIN users r ON r.id = t.receiver_id
     WHERE ${where}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM transactions t
     WHERE ${where}`,
    params
  );

  return {
    data: rows,
    pagination: {
      total,
      page:  pageNum,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
    },
  };
}

module.exports = { sendMoney, getHistory };
