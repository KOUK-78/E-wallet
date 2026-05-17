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
  // Register searchable users
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'John Doe', email: 'john@test.com', password: 'pass1234', phone: '9876543210' });
  token = res.body.token;

  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Jane Smith', email: 'jane@test.com', password: 'pass1234', phone: '1234567890' });
});

afterAll(async () => {
  await teardownTestDb();
});

// ── User search ───────────────────────────────────────────────────────────────

describe('GET /api/users/search', () => {
  it('returns matching users when searching by partial name', async () => {
    const res = await request(app)
      .get('/api/users/search?q=john')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toMatch(/john/i);
  });

  it('returns matching user when searching by exact email', async () => {
    const res = await request(app)
      .get('/api/users/search?q=jane@test.com')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].email).toBe('jane@test.com');
  });

  it('returns matching user when searching by phone number', async () => {
    const res = await request(app)
      .get('/api/users/search?q=9876543210')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].phone).toBe('9876543210');
  });

  it('never exposes password_hash in results', async () => {
    const res = await request(app)
      .get('/api/users/search?q=john')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(user => {
      expect(user.password_hash).toBeUndefined();
    });
  });

  it('returns empty array when no user matches', async () => {
    const res = await request(app)
      .get('/api/users/search?q=xyz_nobody_exists')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 400 when q is empty', async () => {
    const res = await request(app)
      .get('/api/users/search?q=')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/users/search?q=john');
    expect(res.status).toBe(401);
  });
});
