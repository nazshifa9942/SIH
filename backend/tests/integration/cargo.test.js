jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const { resetCargo, resetPorts, resetUsers } = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

describe('Cargo API', () => {
    let pm1Token, pm2Token, adminToken, logManagerToken, viewerToken;
    let portAId, portBId;

    beforeEach(async () => {
        resetCargo();
        resetPorts();
        resetUsers();

        // Register Users
        const pm1 = await request(app).post('/api/auth/register').send({
            name: 'PM One',
            email: 'pm1@example.com',
            password: 'password123',
            role: 'PROCUREMENT_MANAGER',
        });
        pm1Token = pm1.body.data.token;

        const pm2 = await request(app).post('/api/auth/register').send({
            name: 'PM Two',
            email: 'pm2@example.com',
            password: 'password123',
            role: 'PROCUREMENT_MANAGER',
        });
        pm2Token = pm2.body.data.token;

        const admin = await request(app).post('/api/auth/register').send({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'ADMIN',
        });
        adminToken = admin.body.data.token;

        const logM = await request(app).post('/api/auth/register').send({
            name: 'Logistics Manager',
            email: 'logm@example.com',
            password: 'password123',
            role: 'LOGISTICS_MANAGER',
        });
        logManagerToken = logM.body.data.token;

        const viewer = await request(app).post('/api/auth/register').send({
            name: 'Viewer User',
            email: 'viewer@example.com',
            password: 'password123',
            role: 'VIEWER',
        });
        viewerToken = viewer.body.data.token;

        // Create Ports
        const portA = await request(app)
            .post('/api/ports')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Port Dampier',
                country: 'Australia',
                maxDraftM: 18.0,
                maxLoaM: 300.0,
                maxBeamM: 50.0,
                handlingCapacityMtDay: 80000.0,
                berthCapacity: 5,
            });
        portAId = portA.body.data.id;

        const portB = await request(app)
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
        portBId = portB.body.data.id;
    });

    describe('POST /api/cargo', () => {
        it('creates cargo request successfully if PM', async () => {
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: 65000.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                    contractDuration: 'Spot',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.cargoType).toBe('coal');
            expect(res.body.data.status).toBe('DRAFT');
        });

        it('rejects cargo request with quantity <= 0', async () => {
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: -100.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('rejects cargo request with identical origin and destination ports', async () => {
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: 65000.0,
                    originPortId: portAId,
                    destinationPortId: portAId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
            expect(res.body.error.message).toContain('ports cannot be the same');
        });

        it('rejects cargo request if ports do not exist in database', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'iron ore',
                    quantityMt: 120000.0,
                    originPortId: falseUuid,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toContain('Origin port does not exist');
        });

        it('rejects role unauthorized users (e.g. Viewer)', async () => {
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: 65000.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/cargo', () => {
        beforeEach(async () => {
            // Seed a cargo request for PM1
            await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: 65000.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });

            // Seed a cargo request for PM2
            await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm2Token}`)
                .send({
                    cargoType: 'iron ore',
                    quantityMt: 120000.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-11-20T00:00:00.000Z',
                });
        });

        it('returns only own cargo requests if PM', async () => {
            const res = await request(app)
                .get('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].cargoType).toBe('coal');
        });

        it('returns all cargo requests if admin or logistics manager', async () => {
            const adminRes = await request(app)
                .get('/api/cargo')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(adminRes.status).toBe(200);
            expect(adminRes.body.data.length).toBe(2);

            const logMRes = await request(app)
                .get('/api/cargo')
                .set('Authorization', `Bearer ${logManagerToken}`);

            expect(logMRes.status).toBe(200);
            expect(logMRes.body.data.length).toBe(2);
        });
    });

    describe('GET /api/cargo/:id', () => {
        let cargoId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: 65000.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });
            cargoId = res.body.data.id;
        });

        it('retrieves successfully if owner', async () => {
            const res = await request(app)
                .get(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${pm1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.cargoType).toBe('coal');
        });

        it('retrieves successfully if admin or logistics manager', async () => {
            const res = await request(app)
                .get(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${logManagerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.cargoType).toBe('coal');
        });

        it('rejects access if not owner and not privileged', async () => {
            const res = await request(app)
                .get(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${pm2Token}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PUT /api/cargo/:id', () => {
        let cargoId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: 65000.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });
            cargoId = res.body.data.id;
        });

        it('updates own cargo request successfully', async () => {
            const res = await request(app)
                .put(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    quantityMt: 70000.0,
                    cargoType: 'steam coal',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.quantityMt).toBe(70000.0);
            expect(res.body.data.cargoType).toBe('steam coal');
        });

        it('updates cargo request successfully if admin', async () => {
            const res = await request(app)
                .put(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'COMMITTED',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('COMMITTED');
        });

        it('rejects updates from unauthorized roles/users', async () => {
            const res = await request(app)
                .put(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${pm2Token}`)
                .send({
                    quantityMt: 50000.0,
                });

            expect(res.status).toBe(403);
        });

        it('fails update if ports are updated to be identical', async () => {
            const res = await request(app)
                .put(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    destinationPortId: portAId, // origin port is already portAId
                });

            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/cargo/:id', () => {
        let cargoId;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/cargo')
                .set('Authorization', `Bearer ${pm1Token}`)
                .send({
                    cargoType: 'coal',
                    quantityMt: 65000.0,
                    originPortId: portAId,
                    destinationPortId: portBId,
                    requiredDate: '2026-10-15T00:00:00.000Z',
                });
            cargoId = res.body.data.id;
        });

        it('deletes cargo request successfully if owner', async () => {
            const deleteRes = await request(app)
                .delete(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${pm1Token}`);

            expect(deleteRes.status).toBe(200);

            // Verify no longer fetchable
            const getRes = await request(app)
                .get(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${pm1Token}`);
            expect(getRes.status).toBe(404);
        });

        it('deletes cargo request successfully if admin', async () => {
            const deleteRes = await request(app)
                .delete(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteRes.status).toBe(200);
        });

        it('rejects deletion if not owner and not admin', async () => {
            const deleteRes = await request(app)
                .delete(`/api/cargo/${cargoId}`)
                .set('Authorization', `Bearer ${logManagerToken}`);

            expect(deleteRes.status).toBe(403);
        });
    });
});
