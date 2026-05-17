/**
 * Test database helper.
 * Uses DB_NAME_TEST env var (defaults to p2p_payment_test).
 * Call setupTestDb() in beforeAll, teardownTestDb() in afterAll.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function getTestPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME_TEST || 'p2p_payment_test',
      waitForConnections: true,
      connectionLimit: 5,
      timezone: '+00:00',
    });
  }
  return pool;
}

async function setupTestDb() {
  const p = await getTestPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100)  NOT NULL,
      email         VARCHAR(255)  NOT NULL UNIQUE,
      phone         VARCHAR(20)   DEFAULT NULL,
      password_hash VARCHAR(255)  NOT NULL,
      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_phone (phone)
    )
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id    INT UNSIGNED  NOT NULL UNIQUE,
      balance    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_wallet_user_test FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sender_id   INT UNSIGNED  NOT NULL,
      receiver_id INT UNSIGNED  NOT NULL,
      amount      DECIMAL(15,2) NOT NULL,
      status      ENUM('success','failed','pending') NOT NULL DEFAULT 'pending',
      type        ENUM('debit','credit','topup')      NOT NULL,
      flagged     BOOLEAN       NOT NULL DEFAULT FALSE,
      note        VARCHAR(255)  DEFAULT NULL,
      created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sender_test   (sender_id),
      INDEX idx_receiver_test (receiver_id),
      INDEX idx_created_test  (created_at),
      CONSTRAINT fk_tx_sender_test   FOREIGN KEY (sender_id)   REFERENCES users(id),
      CONSTRAINT fk_tx_receiver_test FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);
}

async function teardownTestDb() {
  const p = await getTestPool();
  await p.query('SET FOREIGN_KEY_CHECKS = 0');
  await p.query('TRUNCATE TABLE transactions');
  await p.query('TRUNCATE TABLE wallets');
  await p.query('TRUNCATE TABLE users');
  await p.query('SET FOREIGN_KEY_CHECKS = 1');
  await p.end();
  pool = null;
}

async function truncateAll() {
  const p = await getTestPool();
  await p.query('SET FOREIGN_KEY_CHECKS = 0');
  await p.query('TRUNCATE TABLE transactions');
  await p.query('TRUNCATE TABLE wallets');
  await p.query('TRUNCATE TABLE users');
  await p.query('SET FOREIGN_KEY_CHECKS = 1');
}

module.exports = { getTestPool, setupTestDb, teardownTestDb, truncateAll };
