jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const { resetUsers } = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

describe('Auth API', () => {
  beforeEach(() => {
    resetUsers();
  });

  it('registers a user and returns a token without a password hash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Nitin',
      email: 'nitin@example.com',
      password: 'securePass1',
      role: 'PROCUREMENT_MANAGER',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('nitin@example.com');
    expect(res.body.data.user.role).toBe('PROCUREMENT_MANAGER');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|password_hash/);
  });

  it('logs in an existing user', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Nitin',
      email: 'nitin@example.com',
      password: 'securePass1',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'nitin@example.com',
      password: 'securePass1',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('nitin@example.com');
  });

  it('returns the current user on a protected endpoint', async () => {
    const registered = await request(app).post('/api/auth/register').send({
      name: 'Nitin',
      email: 'nitin@example.com',
      password: 'securePass1',
      role: 'LOGISTICS_MANAGER',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registered.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('nitin@example.com');
    expect(res.body.data.user.role).toBe('LOGISTICS_MANAGER');
  });

  it('rejects missing and invalid authentication', async () => {
    const missing = await request(app).get('/api/auth/me');
    expect(missing.status).toBe(401);
    expect(missing.body.success).toBe(false);
    expect(missing.body.error.code).toBe('UNAUTHORIZED');

    const invalid = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-token');
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe('UNAUTHORIZED');
  });

  it('enforces role authorization', async () => {
    const viewer = await request(app).post('/api/auth/register').send({
      name: 'Viewer',
      email: 'viewer@example.com',
      password: 'securePass1',
      role: 'VIEWER',
    });

    const denied = await request(app)
      .get('/api/auth/role-check')
      .set('Authorization', `Bearer ${viewer.body.data.token}`);

    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('FORBIDDEN');

    const admin = await request(app).post('/api/auth/register').send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'securePass1',
      role: 'ADMIN',
    });

    const allowed = await request(app)
      .get('/api/auth/role-check')
      .set('Authorization', `Bearer ${admin.body.data.token}`);

    expect(allowed.status).toBe(200);
    expect(allowed.body.data.authorized).toBe(true);
  });

  it('rejects invalid registration payloads', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'X',
      email: 'not-an-email',
      password: 'short',
      role: 'SUPERUSER',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});
