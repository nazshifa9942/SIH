jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const {
    prisma,
    resetMarket,
    resetCargo,
    resetPorts,
    resetUsers,
} = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

describe('Recommendation API', () => {
    let pmToken1, pmToken2, viewerToken, adminToken;
    let portAId, portBId;
    let cargoRequest1Id, cargoRequest2Id, cargoRequest3Id;

    beforeEach(async () => {
        resetMarket();
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
        pmToken1 = pm1.body.data.token;

        const pm2 = await request(app).post('/api/auth/register').send({
            name: 'PM Two',
            email: 'pm2@example.com',
            password: 'password123',
            role: 'PROCUREMENT_MANAGER',
        });
        pmToken2 = pm2.body.data.token;

        const viewer = await request(app).post('/api/auth/register').send({
            name: 'Viewer User',
            email: 'viewer@example.com',
            password: 'password123',
            role: 'VIEWER',
        });
        viewerToken = viewer.body.data.token;

        const admin = await request(app).post('/api/auth/register').send({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'ADMIN',
        });
        adminToken = admin.body.data.token;

        // Create Ports
        const portA = await prisma.port.create({
            data: {
                name: 'Port A',
                country: 'Australia',
                active: true,
            },
        });
        portAId = portA.id;

        const portB = await prisma.port.create({
            data: {
                name: 'Port B',
                country: 'India',
                active: true,
            },
        });
        portBId = portB.id;

        // Create CargoRequests
        // Owner is PM1 (id 00000000-0000-4000-8000-000000000001)
        const cargo1 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000001',
                cargoType: 'Coal',
                quantityMt: 50000.0,
                originPortId: portAId,
                destinationPortId: portBId,
                requiredDate: new Date('2026-10-15T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest1Id = cargo1.id;

        // Owner is PM2 (id 00000000-0000-4000-8000-000000000002)
        const cargo2 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000002',
                cargoType: 'Coal',
                quantityMt: 45000.0,
                originPortId: portAId,
                destinationPortId: portBId,
                requiredDate: new Date('2026-11-20T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest2Id = cargo2.id;

        // Cargo 3: Owner is PM1, no forecast generated
        const cargo3 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000001',
                cargoType: 'Coal',
                quantityMt: 30000.0,
                originPortId: portAId,
                destinationPortId: portBId,
                requiredDate: new Date('2026-12-01T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest3Id = cargo3.id;

        // Seed historical freight rate for route A -> B
        await prisma.freightRate.create({
            data: {
                observedAt: new Date('2026-08-20T12:00:00.000Z'),
                originPortId: portAId,
                destinationPortId: portBId,
                vesselType: 'Supramax',
                rateValue: 25.0,
                currency: 'USD',
                rateUnit: 'MT',
                source: 'Baltic Index',
            },
        });

        // Seed a forecast record for Cargo1 (which shows rising trend e.g. average rate > 25.0 * 1.02)
        await prisma.forecastRecord.create({
            data: {
                cargoRequestId: cargoRequest1Id,
                modelVersion: 'freight-v1-mock',
                forecastJson: [
                    { date: '2026-09-02', predictedRate: 26.5 },
                    { date: '2026-09-03', predictedRate: 27.0 },
                ],
                confidence: 0.85,
            },
        });

        // Seed a forecast record for Cargo2 (which shows dropping trend e.g. average rate < 25.0 * 0.98)
        await prisma.forecastRecord.create({
            data: {
                cargoRequestId: cargoRequest2Id,
                modelVersion: 'freight-v1-mock',
                forecastJson: [
                    { date: '2026-09-02', predictedRate: 23.5 },
                    { date: '2026-09-03', predictedRate: 24.0 },
                ],
                confidence: 0.85,
            },
        });
    });

    describe('POST /api/recommendations', () => {
        it('successfully generates and persists recommendation for owner PM', async () => {
            const res = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.cargoRequestId).toBe(cargoRequest1Id);
            expect(res.body.data.recommendedAction).toBe('CHARTER_NOW'); // rising trend
            expect(res.body.data.riskLevel).toBe('LOW');
            expect(res.body.data.expectedFreight).toBeCloseTo(26.75, 2);
            expect(res.body.data.estimatedTotalCost).toBe(13800000.00);
            expect(res.body.data.vesselPlanJson.feasible).toBe(true);
            expect(res.body.data.explanation).toContain('upward trend');
        });

        it('successfully triggers recommendation for privileged roles (e.g. Admin)', async () => {
            const res = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    cargoRequestId: cargoRequest2Id,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.recommendedAction).toBe('WAIT'); // dropping trend
            expect(res.body.data.explanation).toContain('downward trend');
        });

        it('rejects recommendation generation if user is not the owner (e.g. PM1 requesting Cargo2)', async () => {
            const res = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest2Id,
                });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('returns INSUFFICIENT_DATA when ForecastRecord is missing', async () => {
            const res = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest3Id,
                });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INSUFFICIENT_DATA');
            expect(res.body.error.message).toContain('No forecast record found');
        });

        it('returns 404 if cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';

            const res = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: falseUuid,
                });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('GET /api/recommendations/:id', () => {
        it('retrieves the generated recommendation details successfully', async () => {
            // First generate recommendation
            const genRes = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            const recId = genRes.body.data.id;

            const res = await request(app)
                .get(`/api/recommendations/${recId}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(recId);
            expect(res.body.data.recommendedAction).toBe('CHARTER_NOW');
        });

        it('rejects access to recommendation for non-owner PM', async () => {
            const genRes = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            const recId = genRes.body.data.id;

            const res = await request(app)
                .get(`/api/recommendations/${recId}`)
                .set('Authorization', `Bearer ${pmToken2}`);

            expect(res.status).toBe(403);
        });

        it('returns 404 if recommendation not found', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .get(`/api/recommendations/${falseUuid}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/cargo/:cargoRequestId/recommendations', () => {
        it('lists recommendations for cargo request successfully', async () => {
            // Create two recommendations
            await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            const res = await request(app)
                .get(`/api/cargo/${cargoRequest1Id}/recommendations`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
        });

        it('rejects listing cargo recommendations if user is not authorized', async () => {
            const res = await request(app)
                .get(`/api/cargo/${cargoRequest1Id}/recommendations`)
                .set('Authorization', `Bearer ${pmToken2}`);

            expect(res.status).toBe(403);
        });
    });
});
