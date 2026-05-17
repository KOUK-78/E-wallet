const request = require('supertest');
const app     = require('../src/app');
const { setupTestDb, teardownTestDb, truncateAll } = require('./helpers/testDb');

// Override DB to test DB
process.env.DB_NAME = process.env.DB_NAME_TEST || 'p2p_payment_test';

beforeAll(async () => {
  await setupTestDb();
});

afterEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await teardownTestDb();
});

// ── Register ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201 with a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 409 when email is already taken', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice2', email: 'alice@test.com', password: 'other123' });

    expect(res.status).toBe(409);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@test.com' });

    expect(res.status).toBe(400);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'pass1234' });
  });

  it('returns 200 with a token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@test.com', password: 'pass1234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('bob@test.com');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 404 when user does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'pass1234' });

    expect(res.status).toBe(404);
  });
});
