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
async function register({ name, email, password, phone }) {
  if (!name || !email || !password) {
    const err = new Error('name, email and password are required');
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

    const [result] = await conn.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, password_hash]
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
      user: { id: userId, name, email, phone: phone || null },
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
    'SELECT id, name, email, phone, password_hash FROM users WHERE email = ?',
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

  const token = signToken(user.id);
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  };
}

module.exports = { register, login };
