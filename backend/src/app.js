require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes        = require('./modules/auth/auth.routes');
const walletRoutes      = require('./modules/wallet/wallet.routes');
const transactionRoutes = require('./modules/transactions/transactions.routes');
const userRoutes        = require('./modules/users/users.routes');
const errorHandler      = require('./middleware/errorHandler');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/wallet',       walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users',        userRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
