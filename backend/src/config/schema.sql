CREATE DATABASE IF NOT EXISTS p2p_payment;
USE p2p_payment;

CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  phone       VARCHAR(20)   DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone)
);

CREATE TABLE IF NOT EXISTS wallets (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL UNIQUE,
  balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
  INDEX idx_sender   (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_created  (created_at),
  CONSTRAINT fk_tx_sender   FOREIGN KEY (sender_id)   REFERENCES users(id),
  CONSTRAINT fk_tx_receiver FOREIGN KEY (receiver_id) REFERENCES users(id)
);
