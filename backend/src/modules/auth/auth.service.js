const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../../config/db');

const SALT_ROUNDS = 10;

function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Register a new user.
 * Creates user row + wallet row in one transaction.
 */
async function register({ name, email, password, phone, tx_pin }) {
  if (!name || !email || !password || !tx_pin) {
    const err = new Error('name, email, password, and 4-digit PIN are required');
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      const err = new Error('Email already in use');
      err.status = 409;
      throw err;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const pin_hash = await bcrypt.hash(tx_pin, SALT_ROUNDS);

    const [result] = await conn.query(
      'INSERT INTO users (name, email, phone, password_hash, tx_pin) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, password_hash, pin_hash]
    );
    const userId = result.insertId;

    await conn.query(
      'INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)',
      [userId]
    );

    await conn.commit();

    const token = signToken(userId);
    return {
      token,
      user: { id: userId, name, email, phone: phone || null, role: 'user', is_frozen: 0 },
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Login with email + password.
 */
async function login({ email, password }) {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, password_hash, role, is_frozen FROM users WHERE email = ?',
    [email]
  );
  if (rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (user.is_frozen) {
    const err = new Error('Your account has been frozen by an administrator');
    err.status = 403;
    throw err;
  }

  const token = signToken(user.id);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, is_frozen: user.is_frozen },
  };
}

module.exports = { register, login };
