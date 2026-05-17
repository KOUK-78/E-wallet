const request = require('supertest');
const app     = require('../src/app');
const { setupTestDb, teardownTestDb, truncateAll } = require('./helpers/testDb');

process.env.DB_NAME = process.env.DB_NAME_TEST || 'p2p_payment_test';

let token;

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await truncateAll();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Carol', email: 'carol@test.com', password: 'pass1234' });
  token = res.body.token;
});

afterAll(async () => {
  await teardownTestDb();
});

// ── Balance ───────────────────────────────────────────────────────────────────

describe('GET /api/wallet/balance', () => {
  it('returns balance 0.00 for a new user', async () => {
    const res = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.balance)).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/wallet/balance');
    expect(res.status).toBe(401);
  });
});

// ── Top-up ────────────────────────────────────────────────────────────────────

describe('POST /api/wallet/topup', () => {
  it('increases balance and returns new balance', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.balance)).toBe(1000);
  });

  it('accumulates multiple top-ups correctly', async () => {
    await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500 });

    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 300 });

    expect(parseFloat(res.body.balance)).toBe(800);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -1 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is zero', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is missing', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
