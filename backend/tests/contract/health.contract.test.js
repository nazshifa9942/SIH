jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const createApp = require('../../src/app');

const app = createApp();

describe('Health contract', () => {
  it('uses the standard success envelope', async () => {
    const res = await request(app).get('/api/health');

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );
    expect(res.body.error).toBeUndefined();
  });

  it('uses the standard error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: expect.any(String),
        details: [],
      },
    });
  });
});
