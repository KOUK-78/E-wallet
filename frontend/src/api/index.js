import client from './client'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login:    (data) => client.post('/auth/login', data),
}

// ── Wallet ────────────────────────────────────────────────────────────────────
export const walletApi = {
  getBalance: ()       => client.get('/wallet/balance'),
  topUp:      (amount) => client.post('/wallet/topup', { amount }),
}

// ── Transactions ──────────────────────────────────────────────────────────────
export const txApi = {
  send:    (data)    => client.post('/transactions/send', data),
  history: (params)  => client.get('/transactions/history', { params }),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  search: (q) => client.get('/users/search', { params: { q } }),
}
