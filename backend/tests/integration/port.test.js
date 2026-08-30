jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const { resetPorts, resetUsers } = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

describe('Port Master Data API', () => {
    let adminToken;
    let viewerToken;

    beforeEach(async () => {
        resetPorts();
        resetUsers();

        // Register admin user
        const adminRes = await request(app).post('/api/auth/register').send({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'securePassword123',
            role: 'ADMIN',
        });
        adminToken = adminRes.body.data.token;

        // Register viewer user
        const viewerRes = await request(app).post('/api/auth/register').send({
            name: 'Viewer User',
            email: 'viewer@example.com',
            password: 'securePassword123',
            role: 'VIEWER',
        });
        viewerToken = viewerRes.body.data.token;
    });

    describe('POST /api/ports', () => {
        it('creates a port successfully if admin', async () => {
            const res = await request(app)
                .post('/api/ports')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Paradip Port',
                    country: 'India',
                    region: 'Odisha',
                    maxDraftM: 16.5,
                    maxLoaM: 260.0,
                    maxBeamM: 45.0,
                    handlingCapacityMtDay: 50000.0,
                    berthCapacity: 4,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Paradip Port');
            expect(res.body.data.active).toBe(true);
        });

        it('rejects port creation if not admin', async () => {
            const res = await request(app)
                .post('/api/ports')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    name: 'Paradip Port',
                    country: 'India',
                    maxDraftM: 16.5,
                    maxLoaM: 260.0,
                    maxBeamM: 45.0,
                    handlingCapacityMtDay: 50000.0,
                    berthCapacity: 4,
                });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('rejects invalid parameters', async () => {
            const res = await request(app)
                .post('/api/ports')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'P', // too short
                    country: 'India',
                    maxDraftM: -5, // must be positive
                    maxLoaM: 260.0,
                    maxBeamM: 45.0,
                    handlingCapacityMtDay: 50000.0,
                    berthCapacity: -1, // must be >= 0
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/ports', () => {
        it('retrieves ports successfully for authenticated user', async () => {
            // Create a port first
            await request(app)
                .post('/api/ports')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Paradip Port',
                    country: 'India',
                    maxDraftM: 16.5,
                    maxLoaM: 260.0,
                    maxBeamM: 45.0,
                    handlingCapacityMtDay: 50000.0,
                    berthCapacity: 4,
                });

            const res = await request(app)
                .get('/api/ports')
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].name).toBe('Paradip Port');
        });

        it('rejects ports retrieval if unauthenticated', async () => {
            const res = await request(app).get('/api/ports');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/ports/:id', () => {
        it('retrieves specific port by ID', async () => {
            const port = await request(app)
                .post('/api/ports')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Paradip Port',
                    country: 'India',
                    maxDraftM: 16.5,
                    maxLoaM: 260.0,
                    maxBeamM: 45.0,
                    handlingCapacityMtDay: 50000.0,
                    berthCapacity: 4,
                });

            const portId = port.body.data.id;

            const res = await request(app)
                .get(`/api/ports/${portId}`)
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Paradip Port');
        });

        it('returns 400 for invalid UUID route parameter', async () => {
            const res = await request(app)
                .get('/api/ports/not-a-uuid')
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('returns 404 if port not found', async () => {
            const res = await request(app)
                .get('/api/ports/00000000-0000-4000-9000-999999999999')
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /api/ports/:id', () => {
        it('updates port successfully if admin', async () => {
            const port = await request(app)
                .post('/api/ports')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Paradip Port',
                    country: 'India',
                    maxDraftM: 16.5,
                    maxLoaM: 260.0,
                    maxBeamM: 45.0,
                    handlingCapacityMtDay: 50000.0,
                    berthCapacity: 4,
                });

            const portId = port.body.data.id;

            const res = await request(app)
                .put(`/api/ports/${portId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Paradip Terminal 2',
                    berthCapacity: 6,
                });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Paradip Terminal 2');
            expect(res.body.data.berthCapacity).toBe(6);
        });

        it('rejects updates if not admin', async () => {
            const port = await request(app)
                .post('/api/ports')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Paradip Port',
                    country: 'India',
                    maxDraftM: 16.5,
                    maxLoaM: 260.0,
                    maxBeamM: 45.0,
                    handlingCapacityMtDay: 50000.0,
                    berthCapacity: 4,
                });

            const portId = port.body.data.id;

            const res = await request(app)
                .put(`/api/ports/${portId}`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    name: 'Paradip Terminal 2',
                });

            expect(res.status).toBe(403);
        });
    });
});
