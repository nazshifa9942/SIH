jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const { prisma, resetPorts, resetUsers, resetVessels } = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

const validVessel = {
  name: 'MV Bulk Carrier',
  vesselType: 'Supramax',
  capacityMt: 50000,
  draftM: 12.5,
  loaM: 190,
  beamM: 32,
  availabilityStatus: 'AVAILABLE',
};

describe('Vessel Master Data API', () => {
  let adminToken;
  let viewerToken;
  let pmToken;

  beforeEach(async () => {
    resetPorts();
    resetUsers();
    resetVessels();

    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'securePassword123',
      role: 'ADMIN',
    });
    adminToken = adminRes.body.data.token;

    const viewerRes = await request(app).post('/api/auth/register').send({
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: 'securePassword123',
      role: 'VIEWER',
    });
    viewerToken = viewerRes.body.data.token;

    const pmRes = await request(app).post('/api/auth/register').send({
      name: 'PM User',
      email: 'pm@example.com',
      password: 'securePassword123',
      role: 'PROCUREMENT_MANAGER',
    });
    pmToken = pmRes.body.data.token;
  });

  describe('POST /api/vessels', () => {
    it('creates a vessel successfully if admin', async () => {
      const res = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVessel);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('MV Bulk Carrier');
      expect(res.body.data.vesselType).toBe('Supramax');
      expect(res.body.data.availabilityStatus).toBe('AVAILABLE');
    });

    it('rejects vessel creation if viewer', async () => {
      const res = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(validVessel);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects vessel creation if procurement manager', async () => {
      const res = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${pmToken}`)
        .send(validVessel);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated create', async () => {
      const res = await request(app).post('/api/vessels').send(validVessel);
      expect(res.status).toBe(401);
    });

    it('rejects invalid parameters', async () => {
      const res = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'V',
          vesselType: 'Supramax',
          capacityMt: -10,
          draftM: 12.5,
          loaM: 190,
          beamM: 32,
          availabilityStatus: 'AVAILABLE',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/vessels', () => {
    it('retrieves vessels for authenticated user', async () => {
      await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVessel);

      const res = await request(app)
        .get('/api/vessels')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('MV Bulk Carrier');
    });

    it('rejects unauthenticated list', async () => {
      const res = await request(app).get('/api/vessels');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/vessels/:id', () => {
    it('retrieves a vessel by id', async () => {
      const created = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVessel);

      const vesselId = created.body.data.id;
      const res = await request(app)
        .get(`/api/vessels/${vesselId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(vesselId);
    });

    it('returns 400 for invalid UUID', async () => {
      const res = await request(app)
        .get('/api/vessels/not-a-uuid')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 if vessel not found', async () => {
      const res = await request(app)
        .get('/api/vessels/00000000-0000-4000-9000-999999999999')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/vessels/:id', () => {
    it('updates a vessel if admin', async () => {
      const created = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVessel);

      const vesselId = created.body.data.id;
      const res = await request(app)
        .put(`/api/vessels/${vesselId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'MV Bulk Carrier II',
          availabilityStatus: 'UNAVAILABLE',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('MV Bulk Carrier II');
      expect(res.body.data.availabilityStatus).toBe('UNAVAILABLE');
    });

    it('rejects updates if not admin', async () => {
      const created = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVessel);

      const vesselId = created.body.data.id;
      const res = await request(app)
        .put(`/api/vessels/${vesselId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Nope' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/vessels/:id/availability', () => {
    it('returns empty array when no windows are seeded', async () => {
      const created = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVessel);

      const vesselId = created.body.data.id;
      const res = await request(app)
        .get(`/api/vessels/${vesselId}/availability`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns seeded availability windows', async () => {
      const created = await request(app)
        .post('/api/vessels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validVessel);

      const vesselId = created.body.data.id;
      await prisma.vesselAvailability.create({
        data: {
          vesselId,
          availableFrom: new Date('2026-09-01T00:00:00.000Z'),
          availableUntil: new Date('2026-12-31T00:00:00.000Z'),
          status: 'AVAILABLE',
          currentLocation: 'Singapore',
          source: 'AIS',
          observedAt: new Date('2026-08-20T12:00:00.000Z'),
        },
      });

      const res = await request(app)
        .get(`/api/vessels/${vesselId}/availability`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].vesselId).toBe(vesselId);
      expect(res.body.data[0].status).toBe('AVAILABLE');
    });

    it('returns 404 for unknown vessel availability', async () => {
      const res = await request(app)
        .get('/api/vessels/00000000-0000-4000-9000-999999999999/availability')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(404);
    });
  });
});
