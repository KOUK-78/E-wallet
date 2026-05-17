# PayFlow — Peer-to-Peer Payment App

A full-stack P2P digital wallet application built with **React + Vite** (frontend) and **Express + MySQL** (backend).

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Database Setup](#3-database-setup)
  - [4. Frontend Setup](#4-frontend-setup)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Known Limitations](#known-limitations)

---

## Features

| Feature | Details |
|---|---|
| 🔐 Auth | JWT-based register & login; wallet auto-created on register |
| 🔑 Transaction PIN | 4-digit PIN required for sending money to enhance security |
| 💰 Wallet | View balance, top-up (simulated deposit) |
| 💸 Send Money | Search users by name / email / phone; atomic transfer with MySQL transactions |
| 📜 History | Paginated transaction history with filters (type, amount range, date) |
| 📊 Analytics | Visualize 30-day spending trends with Recharts on the dashboard |
| 🚨 Fraud Detection | Auto-flags transactions > ₹50,000 or if sender sends > 5 times in 60 seconds |
| 🛡️ Admin Dashboard | View platform stats, manage users, and freeze suspicious accounts (`role='admin'`) |
| 🔒 Deadlock-safe | Wallet rows locked in consistent ID order (`SELECT … FOR UPDATE`) |
| ⚡ Rate Limiting | 60 requests/min per IP via `express-rate-limit` |

---

## Project Structure

```
e-wallet/
├── backend/                  # Express API
│   ├── src/
│   │   ├── app.js            # Entry point
│   │   ├── config/
│   │   │   ├── db.js         # MySQL connection pool
│   │   │   └── schema.sql    # Database schema
│   │   ├── middleware/
│   │   │   ├── authenticate.js   # JWT guard
│   │   │   └── errorHandler.js   # Global error handler
│   │   └── modules/
│   │       ├── auth/         # Register & Login
│   │       ├── wallet/       # Balance & Top-up
│   │       ├── transactions/ # Send & History
│   │       ├── users/        # User search
│   │       └── fraud/        # Fraud detection rules
│   ├── tests/
│   │   ├── helpers/
│   │   │   └── testDb.js     # Test DB helpers (setup/teardown)
│   │   ├── auth.test.js
│   │   ├── wallet.test.js
│   │   ├── transactions.test.js
│   │   ├── users.test.js
│   │   └── history.test.js
│   ├── env.example
│   └── package.json
│
└── frontend/                 # React + Vite SPA
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx          # Vite entry point
        ├── App.jsx           # Router + QueryClientProvider
        ├── index.css         # Tailwind base styles
        ├── api/
        │   ├── client.js     # Axios instance + interceptors
        │   └── index.js      # API endpoint helpers
        ├── components/
        │   ├── AppLayout.jsx     # Sidebar + mobile nav shell
        │   ├── ProtectedRoute.jsx
        │   ├── TransactionRow.jsx
        │   └── ui/           # shadcn-style UI primitives
        │       ├── button.jsx
        │       ├── card.jsx
        │       ├── badge.jsx
        │       ├── input.jsx
        │       ├── label.jsx
        │       └── separator.jsx
        ├── context/
        │   └── AuthContext.jsx   # Auth state + localStorage persistence
        ├── hooks/
        │   ├── useWallet.js      # TanStack Query hooks for wallet
        │   └── useTransactions.js
        ├── lib/
        │   └── utils.js          # cn() helper (clsx + tailwind-merge)
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            ├── SendPage.jsx
            ├── TopUpPage.jsx
            └── HistoryPage.jsx
```

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| `express` | HTTP server & routing |
| `mysql2` | MySQL driver (promise API + connection pool) |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT signing & verification |
| `express-rate-limit` | Rate limiting |
| `dotenv` | Environment variable loading |
| `jest` + `supertest` | Integration testing |

### Frontend
| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `@tanstack/react-query` | Server-state management & caching |
| `axios` | HTTP client |
| `tailwindcss` | Utility-first CSS |
| `@radix-ui/*` | Accessible UI primitives |
| `recharts` | Data visualization and charts |
| `lucide-react` | Icons |
| `date-fns` | Date formatting |
| `clsx` + `tailwind-merge` | Conditional class merging |

---

## Prerequisites

- **Node.js** v18 or higher
- **MySQL** 8.0 or higher (running locally or via Docker)
- **npm** v9 or higher

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd e-wallet
```

### 2. Backend Setup

```bash
cd backend
cp env.example .env
# Edit .env with your DB credentials (see Environment Variables section)
npm install
```

### 3. Database Setup

Connect to your MySQL server and run the schema:

```bash
mysql -u root -p < backend/src/config/schema.sql
```

This creates the `p2p_payment` database and all three tables (`users`, `wallets`, `transactions`).

**For testing**, create a separate test database:

```sql
CREATE DATABASE p2p_payment_test;
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

---

## Running the App

### Backend (development)

```bash
cd backend
npm run dev      # nodemon auto-reload on port 5000
```

### Frontend (development)

```bash
cd frontend
npm run dev      # Vite dev server on http://localhost:5173
```

> The Vite dev server proxies all `/api` requests to `http://localhost:5000`, so CORS is not an issue during development.

### Production build

```bash
cd frontend
npm run build    # Output in frontend/dist/
```

Serve `frontend/dist/` with any static file server or integrate into the Express app:

```js
// In backend/src/app.js (optional)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | ❌ | `{ name, email, password, tx_pin, phone? }` | `{ token, user }` |
| POST | `/api/auth/login` | ❌ | `{ email, password }` | `{ token, user }` |

### Wallet

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/wallet/balance` | ✅ | — | `{ balance }` |
| POST | `/api/wallet/topup` | ✅ | `{ amount }` | `{ balance }` |

### Transactions

| Method | Endpoint | Auth | Body / Query | Response |
|---|---|---|---|---|
| POST | `/api/transactions/send` | ✅ | `{ recipientEmail, amount, tx_pin, note? }` | `{ message, transactionId, amount, flagged }` |
| GET | `/api/transactions/history` | ✅ | `?type=debit\|credit\|topup&page=1&limit=10&minAmount=&maxAmount=&from=&to=` | `{ data[], pagination }` |
| GET | `/api/transactions/analytics` | ✅ | — | `[ { date, total_spent } ]` |

### Admin

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/admin/stats` | ✅ (Admin) | — | `{ total_users, total_volume, fraud_flags }` |
| GET | `/api/admin/users` | ✅ (Admin) | — | `[ { id, name, email, balance, is_frozen... } ]` |
| POST | `/api/admin/users/:id/freeze` | ✅ (Admin) | — | `{ id, is_frozen }` |

### Users

| Method | Endpoint | Auth | Query | Response |
|---|---|---|---|---|
| GET | `/api/users/search` | ✅ | `?q=<searchTerm>` | `{ data[] }` |

### Status codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Unauthorized |
| `404` | Not found |
| `409` | Conflict (e.g. email already taken) |
| `422` | Insufficient balance |
| `500` | Internal server error |

---

## Testing

Tests are integration tests that hit real API routes against a **dedicated test database**.

### Requirements

Make sure `p2p_payment_test` database exists (schema is auto-created by `testDb.js`).

Set the following in your shell or `.env`:

```env
DB_NAME_TEST=p2p_payment_test
```

### Run tests

```bash
cd backend
npm test               # Run all tests once
npm run test:watch     # Watch mode
```

### Test files

| File | What it tests |
|---|---|
| `auth.test.js` | Register, Login (success + error cases) |
| `wallet.test.js` | Balance, Top-up |
| `transactions.test.js` | Send money (balance checks, self-send, fraud flag) |
| `users.test.js` | User search |
| `history.test.js` | Transaction history (pagination, type/amount filters) |

---

## Environment Variables

Create `backend/.env` from `backend/env.example`:

```env
# Server
PORT=5000

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=p2p_payment

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```

For tests, add:

```env
DB_NAME_TEST=p2p_payment_test
```

---

## Known Limitations

- **No email verification** — users can register with any email.
- **Simulated top-up** — there is no real payment gateway integration.
- **No refresh tokens** — JWTs expire after 7 days and there is no silent refresh.
- **No push notifications** — transaction alerts are only visible by refreshing the UI.
- **Single currency** — amounts are in Indian Rupees (₹) with no currency conversion.
