jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const {
    prisma,
    resetMarket,
    resetCargo,
    resetPorts,
    resetUsers,
    resetVessels,
    resetVoyagePlans,
} = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

const ZERO_PLACEHOLDER_LABEL = 'ZERO_PLACEHOLDER_UNDOCUMENTED';

describe('Cost API', () => {
    let pmToken1, pmToken2, viewerToken, adminToken, lmToken;
    let portAId, portBId, portCId;
    let cargoRequest1Id, cargoRequest2Id, cargoRequest3Id, cargoRequest4Id;
    let voyagePlan1Id, voyagePlan2Id;

    beforeEach(async () => {
        resetMarket();
        resetCargo();
        resetPorts();
        resetUsers();
        resetVessels();
        resetVoyagePlans();

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

        const lm = await request(app).post('/api/auth/register').send({
            name: 'Logistics Manager',
            email: 'lm@example.com',
            password: 'password123',
            role: 'LOGISTICS_MANAGER',
        });
        lmToken = lm.body.data.token;

        // Create Ports
        const portA = await prisma.port.create({
            data: { name: 'Port A', country: 'Australia', active: true },
        });
        portAId = portA.id;

        const portB = await prisma.port.create({
            data: { name: 'Port B', country: 'India', active: true },
        });
        portBId = portB.id;

        const portC = await prisma.port.create({
            data: { name: 'Port C', country: 'Brazil', active: true },
        });
        portCId = portC.id;

        // Cargo 1: Owner PM1, has forecast (avg 26.75)
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

        // Cargo 2: Owner PM2, NO forecast -> falls back to route freight rate
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

        // Cargo 3: Owner PM1, forecast exists but is EMPTY
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

        // Cargo 4: Owner PM1, route B->C has neither forecast nor freight rate
        const cargo4 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000001',
                cargoType: 'Iron Ore',
                quantityMt: 20000.0,
                originPortId: portBId,
                destinationPortId: portCId,
                requiredDate: new Date('2026-12-15T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest4Id = cargo4.id;

        // Seed historical freight rate for route A -> B only
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

        // Forecast for Cargo1 (rising rates, avg 26.75)
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

        // Empty forecast for Cargo3
        await prisma.forecastRecord.create({
            data: {
                cargoRequestId: cargoRequest3Id,
                modelVersion: 'freight-v1-mock',
                forecastJson: [],
                confidence: 0.85,
            },
        });

        // Vessel + Voyage plans
        const vessel = await prisma.vessel.create({
            data: {
                name: 'Test Vessel One',
                vesselType: 'Supramax',
                capacityMt: 55000.0,
                draftM: 12.0,
                loaM: 190.0,
                beamM: 32.0,
                availabilityStatus: 'AVAILABLE',
            },
        });

        const vp1 = await prisma.voyagePlan.create({
            data: {
                cargoRequestId: cargoRequest1Id,
                vesselId: vessel.id,
                originPortId: portAId,
                destinationPortId: portBId,
                tripNumber: 1,
                plannedQuantityMt: 50000.0,
                eta: null,
                estimatedCost: 13800000.0,
                feasibilityStatus: 'FEASIBLE',
            },
        });
        voyagePlan1Id = vp1.id;

        const vp2 = await prisma.voyagePlan.create({
            data: {
                cargoRequestId: cargoRequest2Id,
                vesselId: vessel.id,
                originPortId: portAId,
                destinationPortId: portBId,
                tripNumber: 1,
                plannedQuantityMt: 45000.0,
                eta: null,
                estimatedCost: 13800000.0,
                feasibilityStatus: 'FEASIBLE',
            },
        });
        voyagePlan2Id = vp2.id;
    });

    describe('POST /api/cost/estimate', () => {
        it('computes and persists a forecast-based estimate for the owner', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.cargoRequestId).toBe(cargoRequest1Id);
            expect(res.body.data.voyagePlanId).toBeNull();

            // freightCost = avg(predictedRate) x quantityMt = 26.75 x 50000
            expect(res.body.data.freightCost).toBe(1337500);

            // UNSPECIFIED components stay zero placeholders
            expect(res.body.data.fuelCost).toBe(0);
            expect(res.body.data.portCost).toBe(0);
            expect(res.body.data.handlingCost).toBe(0);
            expect(res.body.data.delayCost).toBe(0);
            expect(res.body.data.repositioningCost).toBe(0);
            expect(res.body.data.otherCost).toBe(0);

            // total = additive composition of components
            expect(res.body.data.totalCost).toBe(1337500);

            // Transparent derivation metadata
            expect(res.body.data.meta.freightSource).toBe('FORECAST');
            expect(res.body.data.meta.freightUnitRate).toBeCloseTo(26.75, 4);
            expect(res.body.data.meta.componentStatus.freight).toBe('COMPUTED');
            expect(res.body.data.meta.componentStatus.fuel).toBe(ZERO_PLACEHOLDER_LABEL);
            expect(res.body.data.meta.componentStatus.port).toBe(ZERO_PLACEHOLDER_LABEL);
            expect(res.body.data.meta.componentStatus.handling).toBe(ZERO_PLACEHOLDER_LABEL);
            expect(res.body.data.meta.componentStatus.delay).toBe(ZERO_PLACEHOLDER_LABEL);
            expect(res.body.data.meta.componentStatus.repositioning).toBe(ZERO_PLACEHOLDER_LABEL);
            expect(res.body.data.meta.componentStatus.other).toBe(ZERO_PLACEHOLDER_LABEL);
        });

        it('falls back to the latest observed route freight rate when no forecast exists', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken2}`)
                .send({ cargoRequestId: cargoRequest2Id });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.meta.freightSource).toBe('MARKET_OBSERVATION');
            expect(res.body.data.meta.freightUnitRate).toBeCloseTo(25.0, 4);

            // freightCost = 25.0 x 45000
            expect(res.body.data.freightCost).toBe(1125000);
            expect(res.body.data.totalCost).toBe(1125000);
        });

        it('links the persisted breakdown to a valid voyage plan of the same cargo', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                    voyagePlanId: voyagePlan1Id,
                });

            expect(res.status).toBe(201);
            expect(res.body.data.voyagePlanId).toBe(voyagePlan1Id);
        });

        it('allows ADMIN to estimate cost for another user\'s cargo request', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.totalCost).toBe(1337500);
        });

        it('allows LOGISTICS_MANAGER to estimate cost for another user\'s cargo request', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${lmToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });

        it('returns 404 when the cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: falseUuid });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects estimation by a non-owner PROCUREMENT_MANAGER with 403', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken2}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('rejects estimation by a non-owner VIEWER with 403', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('returns INSUFFICIENT_DATA when there is no forecast and no route freight rate', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest4Id });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INSUFFICIENT_DATA');
        });

        it('returns INSUFFICIENT_DATA when the latest forecast record is empty', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest3Id });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INSUFFICIENT_DATA');
            expect(res.body.error.message).toContain('empty forecast data');
        });

        it('rejects a voyage plan that belongs to another cargo request with 400', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                    voyagePlanId: voyagePlan2Id,
                });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
            expect(res.body.error.message).toContain('does not belong');
        });

        it('returns 404 when the referenced voyage plan does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999998';
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({
                    cargoRequestId: cargoRequest1Id,
                    voyagePlanId: falseUuid,
                });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects a malformed cargoRequestId uuid with 400', async () => {
            const res = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: 'not-a-uuid' });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/cost/:cargoRequestId', () => {
        it('lists persisted breakdowns for the cargo request newest-first', async () => {
            await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            const res = await request(app)
                .get(`/api/cost/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);

            const [first, second] = res.body.data;
            expect(
                new Date(first.createdAt).getTime()
            ).toBeGreaterThanOrEqual(new Date(second.createdAt).getTime());
            expect(first.totalCost).toBe(1337500);
            expect(second.totalCost).toBe(1337500);
        });

        it('returns an empty list when no breakdowns exist yet', async () => {
            const res = await request(app)
                .get(`/api/cost/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual([]);
        });

        it('rejects listing by a non-owner with 403', async () => {
            await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            const res = await request(app)
                .get(`/api/cost/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken2}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('returns 404 when the cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .get(`/api/cost/${falseUuid}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects a malformed cargoRequestId param with 400', async () => {
            const res = await request(app)
                .get('/api/cost/not-a-uuid')
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Phase 2.1-2.5 regression compatibility', () => {
        it('keeps the Phase 2.3 recommendation flow and its placeholder breakdown unchanged', async () => {
            const recRes = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(recRes.status).toBe(201);
            expect(recRes.body.data.estimatedTotalCost).toBe(13800000.0);

            // The recommendation flow persists its own placeholder breakdown
            const breakdowns = await prisma.costBreakdown.findMany({
                where: { cargoRequestId: cargoRequest1Id },
            });
            expect(breakdowns.length).toBe(1);
            expect(breakdowns[0].totalCost).toBe(13800000.0);
            expect(breakdowns[0].freightCost).toBeCloseTo(26.75 * 50000, 2);
            expect(breakdowns[0].fuelCost).toBe(0);
            expect(breakdowns[0].portCost).toBe(0);
            expect(breakdowns[0].handlingCost).toBe(0);
            expect(breakdowns[0].delayCost).toBe(0);
            expect(breakdowns[0].repositioningCost).toBe(0);
            expect(breakdowns[0].otherCost).toBe(0);
        });
    });
});