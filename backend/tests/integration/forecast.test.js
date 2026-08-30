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

describe('Forecast API', () => {
    let pmToken1, pmToken2, viewerToken, adminToken;
    let portAId, portBId, portCId;
    let cargoRequest1Id, cargoRequest2Id;

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

        const portC = await prisma.port.create({
            data: {
                name: 'Port C',
                country: 'China',
                active: true,
            },
        });
        portCId = portC.id;

        // Create CargoRequests
        // Owner is PM1
        const cargo1 = await prisma.cargoRequest.create({
            data: {
                userId: `00000000-0000-4000-8000-000000000001`,
                cargoType: 'Coal',
                quantityMt: 50000.0,
                originPortId: portAId,
                destinationPortId: portBId,
                requiredDate: new Date('2026-10-15T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest1Id = cargo1.id;

        // No historical freight rate for this second route (Port A -> Port C)
        const cargo2 = await prisma.cargoRequest.create({
            data: {
                userId: `00000000-0000-4000-8000-000000000001`,
                cargoType: 'Coal',
                quantityMt: 45000.0,
                originPortId: portAId,
                destinationPortId: portCId,
                requiredDate: new Date('2026-11-20T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest2Id = cargo2.id;

        // Seed historical freight rate for A -> B
        await prisma.freightRate.create({
            data: {
                observedAt: new Date('2026-08-20T12:00:00.000Z'),
                originPortId: portAId,
                destinationPortId: portBId,
                vesselType: 'Supramax',
                rateValue: 22.4,
                currency: 'USD',
                rateUnit: 'MT',
                source: 'Baltic Index',
            },
        });

        // Seed other features
        await prisma.fuelPrice.create({
            data: {
                observedAt: new Date(),
                fuelType: 'VLSFO',
                region: 'Singapore',
                price: 620.0,
                currency: 'USD',
                source: 'Bunker',
            },
        });

        await prisma.commodityPrice.create({
            data: {
                observedAt: new Date(),
                commodity: 'Coal',
                market: 'Newcastle',
                price: 110.0,
                currency: 'USD',
                source: 'Index',
            },
        });
    });

    describe('POST /api/forecast/freight', () => {
        it('successfully orchestrates and persists forecast for owner PM', async () => {
            const res = await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                    forecastHorizonDays: 7,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.cargoRequestId).toBe(cargoRequest1Id);
            expect(res.body.data.modelVersion).toBe('freight-v1-mock');
            expect(res.body.data.confidence).toBe(0.85);
            expect(res.body.data.forecastJson.length).toBe(7);
            expect(res.body.data.forecastJson[0].date).toBeDefined();
            expect(res.body.data.forecastJson[0].predictedRate).toBeGreaterThan(0);
        });

        it('successfully triggers forecast for privileged roles (e.g. Admin)', async () => {
            const res = await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('rejects forecast execution if user is not the owner (e.g. PM2)', async () => {
            const res = await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${pmToken2}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('returns 404 if cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';

            const res = await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: falseUuid,
                });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('returns INSUFFICIENT_DATA and throws 400 when no historical route rates exist', async () => {
            const res = await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest2Id,
                });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INSUFFICIENT_DATA');
            expect(res.body.error.message).toContain(
                'Insufficient historical freight rate data'
            );
        });

        // Phase 2.2 validation boundary
        it('accepts forecast horizon of 90 days', async () => {
            const res = await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                    forecastHorizonDays: 90,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.forecastJson.length).toBe(90);
        });

        it('rejects forecast horizon above 90 days', async () => {
            const res = await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                    forecastHorizonDays: 91,
                });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/forecast/:cargoRequestId', () => {
        it('retrieves the latest saved forecast record for the cargo request', async () => {
            // First generate one
            await request(app)
                .post('/api/forecast/freight')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                });

            const res = await request(app)
                .get(`/api/forecast/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.cargoRequestId).toBe(cargoRequest1Id);
            expect(res.body.data.modelVersion).toBe('freight-v1-mock');
        });

        it('rejects access to other cargo requests forecasts', async () => {
            const res = await request(app)
                .get(`/api/forecast/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken2}`);

            expect(res.status).toBe(403);
        });

        it('returns 404 if no forecast has been generated yet', async () => {
            const res = await request(app)
                .get(`/api/forecast/${cargoRequest2Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });
});