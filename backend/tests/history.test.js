const request = require('supertest');
const app     = require('../src/app');
const { setupTestDb, teardownTestDb, truncateAll } = require('./helpers/testDb');

process.env.DB_NAME = process.env.DB_NAME_TEST || 'p2p_payment_test';

let aliceToken, bobToken;

async function reg(name, email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'pass1234' });
  return res.body.token;
}

async function topup(token, amount) {
  return request(app)
    .post('/api/wallet/topup')
    .set('Authorization', `Bearer ${token}`)
    .send({ amount });
}

async function send(token, recipientEmail, amount) {
  return request(app)
    .post('/api/transactions/send')
    .set('Authorization', `Bearer ${token}`)
    .send({ recipientEmail, amount });
}

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await truncateAll();
  aliceToken = await reg('Alice', 'alice@hist.com');
  bobToken   = await reg('Bob',   'bob@hist.com');

  // Fund Alice and create a spread of transactions
  await topup(aliceToken, 10000);       // topup #1
  await send(aliceToken, 'bob@hist.com', 200);  // debit #1
  await send(aliceToken, 'bob@hist.com', 500);  // debit #2
  await send(aliceToken, 'bob@hist.com', 1500); // debit #3
});

afterAll(async () => {
  await teardownTestDb();
});

// ── History ───────────────────────────────────────────────────────────────────

describe('GET /api/transactions/history', () => {
  it('returns a paginated list of all transactions for the user', async () => {
    const res = await request(app)
      .get('/api/transactions/history')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('filters by type=debit and only returns debit rows for the sender', async () => {
    const res = await request(app)
      .get('/api/transactions/history?type=debit')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.type === 'debit')).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it('filters by type=credit and only returns credit rows for the receiver', async () => {
    const res = await request(app)
      .get('/api/transactions/history?type=credit')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.type === 'credit')).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it('filters by type=topup and only returns top-up rows', async () => {
    const res = await request(app)
      .get('/api/transactions/history?type=topup')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.type === 'topup')).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('filters by minAmount and maxAmount correctly', async () => {
    const res = await request(app)
      .get('/api/transactions/history?minAmount=300&maxAmount=1000')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(t => {
      expect(parseFloat(t.amount)).toBeGreaterThanOrEqual(300);
      expect(parseFloat(t.amount)).toBeLessThanOrEqual(1000);
    });
  });

  it('paginates correctly: page=1 limit=2 returns 2 rows', async () => {
    const res = await request(app)
      .get('/api/transactions/history?page=1&limit=2')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('page=2 limit=2 returns different rows from page=1', async () => {
    const page1 = await request(app)
      .get('/api/transactions/history?page=1&limit=2')
      .set('Authorization', `Bearer ${aliceToken}`);

    const page2 = await request(app)
      .get('/api/transactions/history?page=2&limit=2')
      .set('Authorization', `Bearer ${aliceToken}`);

    const ids1 = page1.body.data.map(t => t.id);
    const ids2 = page2.body.data.map(t => t.id);
    const overlap = ids1.filter(id => ids2.includes(id));

    expect(overlap.length).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/transactions/history');
    expect(res.status).toBe(401);
  });
});
