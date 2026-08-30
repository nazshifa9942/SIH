jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const createApp = require('../../src/app');

const app = createApp();

describe('GET /api/health', () => {
  it('indicates the backend is running', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Backend is running');
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('sih26006-backend');
  });
});
