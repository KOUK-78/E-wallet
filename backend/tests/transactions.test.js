const request = require('supertest');
const app     = require('../src/app');
const { setupTestDb, teardownTestDb, truncateAll } = require('./helpers/testDb');

process.env.DB_NAME = process.env.DB_NAME_TEST || 'p2p_payment_test';

let senderToken, receiverToken;

async function registerAndFund(name, email, topupAmount = 0) {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'pass1234' });
  const { token } = regRes.body;

  if (topupAmount > 0) {
    await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: topupAmount });
  }
  return token;
}

beforeAll(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await truncateAll();
  senderToken   = await registerAndFund('Sender', 'sender@test.com', 5000);
  receiverToken = await registerAndFund('Receiver', 'receiver@test.com');
});

afterAll(async () => {
  await teardownTestDb();
});

// ── Send money ────────────────────────────────────────────────────────────────

describe('POST /api/transactions/send', () => {
  it('transfers money: deducts sender, credits receiver', async () => {
    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientEmail: 'receiver@test.com', amount: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();

    // Verify sender balance
    const senderBal = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${senderToken}`);
    expect(parseFloat(senderBal.body.balance)).toBe(4000);

    // Verify receiver balance
    const receiverBal = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${receiverToken}`);
    expect(parseFloat(receiverBal.body.balance)).toBe(1000);
  });

  it('returns 422 when sender has insufficient balance', async () => {
    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientEmail: 'receiver@test.com', amount: 9999 });

    expect(res.status).toBe(422);
  });

  it('returns 404 when recipient does not exist', async () => {
    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientEmail: 'nobody@test.com', amount: 100 });

    expect(res.status).toBe(404);
  });

  it('returns 400 when sending to self', async () => {
    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientEmail: 'sender@test.com', amount: 100 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is zero or negative', async () => {
    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientEmail: 'receiver@test.com', amount: 0 });

    expect(res.status).toBe(400);
  });

  it('succeeds but flags transaction when amount exceeds 50000', async () => {
    // Give sender enough funds
    await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ amount: 100000 });

    const res = await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientEmail: 'receiver@test.com', amount: 60000 });

    expect(res.status).toBe(200);
    expect(res.body.flagged).toBe(true);
  });

  it('does not mutate balances when transaction fails mid-way', async () => {
    // Attempt with insufficient balance — balances must remain unchanged
    await request(app)
      .post('/api/transactions/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientEmail: 'receiver@test.com', amount: 99999 });

    const senderBal = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${senderToken}`);
    expect(parseFloat(senderBal.body.balance)).toBe(5000);
  });
});
