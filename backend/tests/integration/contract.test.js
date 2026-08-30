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

const POLICY = 'PHASE_2_9_CONTRACT_COMPARE_MOCK';
const DISCLAIMER =
    'Compare spot, short-term, multiple-voyage and longer-term options only when sufficient data exists.';
const EXPECTED_STRATEGIES = ['SPOT', 'SHORT_TERM', 'MULTIPLE_VOYAGE', 'LONGER_TERM'];

describe('Contract Strategy API', () => {
    let pmToken1, pmToken2, viewerToken, adminToken, lmToken;
    let portAId, portBId;
    let cargoRequest1Id, cargoRequest2Id, cargoRequest3Id, cargoRequest4Id;

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

        // Ports
        const portA = await prisma.port.create({
            data: { name: 'Port A', country: 'Australia', active: true },
        });
        portAId = portA.id;

        const portB = await prisma.port.create({
            data: { name: 'Port B', country: 'India', active: true },
        });
        portBId = portB.id;

        // Port C: no freight rates, no forecasts, no congestion (gate-failure route)
        const portC = await prisma.port.create({
            data: { name: 'Port C', country: 'Brazil', active: true },
        });
        const portCId = portC.id;

        // Cargo 1: Owner PM1, contractDuration 'Spot', forecast (avg 26.75),
        // voyage plans and a cost breakdown -> full reference metrics
        const cargo1 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000001',
                cargoType: 'Coal',
                quantityMt: 50000.0,
                originPortId: portAId,
                destinationPortId: portBId,
                requiredDate: new Date('2026-10-15T00:00:00.000Z'),
                contractDuration: 'Spot',
                status: 'DRAFT',
            },
        });
        cargoRequest1Id = cargo1.id;

        // Cargo 2: Owner PM2, NO contractDuration, NO forecast
        // (market-rate fallback path)
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

        // Cargo 3: Owner PM1, route B->C with neither forecast nor rate
        // (sufficiency gate failure)
        const cargo3 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000001',
                cargoType: 'Iron Ore',
                quantityMt: 20000.0,
                originPortId: portBId,
                destinationPortId: portCId,
                requiredDate: new Date('2026-12-01T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest3Id = cargo3.id;

        // Cargo 4: Owner PM1, route A->B with forecast but no voyage plans
        // and no cost breakdown (null metric echoes)
        const cargo4 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000001',
                cargoType: 'Coal',
                quantityMt: 30000.0,
                originPortId: portAId,
                destinationPortId: portBId,
                requiredDate: new Date('2026-12-15T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest4Id = cargo4.id;

        // Freight rates on route A->B only (latest 25.0)
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

        // Forecasts
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
        await prisma.forecastRecord.create({
            data: {
                cargoRequestId: cargoRequest4Id,
                modelVersion: 'freight-v1-mock',
                forecastJson: [{ date: '2026-09-02', predictedRate: 24.0 }],
                confidence: 0.9,
            },
        });

        // Vessel + two voyage plans for cargo1
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

        await prisma.voyagePlan.create({
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
        await prisma.voyagePlan.create({
            data: {
                cargoRequestId: cargoRequest1Id,
                vesselId: vessel.id,
                originPortId: portAId,
                destinationPortId: portBId,
                tripNumber: 2,
                plannedQuantityMt: 10000.0,
                eta: null,
                estimatedCost: 13800000.0,
                feasibilityStatus: 'FEASIBLE',
            },
        });

        // Cost breakdown for cargo1 (as Phase 2.6 would persist)
        await prisma.costBreakdown.create({
            data: {
                cargoRequestId: cargoRequest1Id,
                voyagePlanId: null,
                freightCost: 1337500,
                fuelCost: 0,
                portCost: 0,
                handlingCost: 0,
                delayCost: 0,
                repositioningCost: 0,
                otherCost: 0,
                totalCost: 1337500,
            },
        });
    });

    describe('POST /api/contracts/compare', () => {
        it('returns the approved comparison shape for the owner', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const data = res.body.data;
            expect(data.cargoRequestId).toBe(cargoRequest1Id);
            expect(data.comparedAt).toBeDefined();

            // Free-text contractDuration echo (no mapping applied)
            expect(data.cargo.contractDuration).toBe('Spot');
            expect(data.cargo.quantityMt).toBe(50000);

            // Sufficiency via reused cost gate
            expect(data.sufficiency.status).toBe('SUFFICIENT_DATA');
            expect(data.sufficiency.freightSource).toBe('FORECAST');
            expect(data.sufficiency.freightUnitRate).toBeCloseTo(26.75, 4);

            // Exactly the four DOCUMENTED strategies, in order
            expect(data.strategies.map((s) => s.strategy)).toEqual(EXPECTED_STRATEGIES);
            expect(data.strategies.every((s) => s.status === 'EVALUABLE')).toBe(true);

            // Shared reference metrics (INFERRED arithmetic, no per-strategy prices)
            expect(data.referenceMetrics.indicativeFreightOutlay).toBe(1337500);
            expect(data.referenceMetrics.forecastConfidence).toBe(0.85);
            expect(data.referenceMetrics.plannedTripCount).toBe(2);
            expect(data.referenceMetrics.latestEstimatedTotalCost).toBe(1337500);

            // No winner is ever selected
            expect(data.selection).toEqual({
                status: 'NOT_DETERMINED',
                reason: 'NO_STRATEGY_SELECTION_ALGORITHM_DOCUMENTED',
            });

            expect(data.basis.policy).toBe(POLICY);
            expect(data.disclaimer).toBe(DISCLAIMER);
        });

        it('falls back to MARKET_OBSERVATION when no forecast exists', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken2}`)
                .send({ cargoRequestId: cargoRequest2Id });

            expect(res.status).toBe(200);
            const data = res.body.data;
            expect(data.sufficiency.freightSource).toBe('MARKET_OBSERVATION');
            expect(data.sufficiency.freightUnitRate).toBeCloseTo(25.0, 4);
            expect(data.referenceMetrics.indicativeFreightOutlay).toBe(1125000); // 25 x 45000
            expect(data.referenceMetrics.forecastConfidence).toBeNull();
            expect(data.cargo.contractDuration).toBeNull();
        });

        it('returns null metric echoes when no voyage plans or breakdowns exist', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest4Id });

            expect(res.status).toBe(200);
            const data = res.body.data;
            expect(data.sufficiency.freightSource).toBe('FORECAST');
            expect(data.referenceMetrics.plannedTripCount).toBe(0);
            expect(data.referenceMetrics.latestEstimatedTotalCost).toBeNull();
            expect(data.referenceMetrics.indicativeFreightOutlay).toBe(720000); // 24 x 30000
        });

        it('allows ADMIN to compare contracts for another user\'s cargo request', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.cargoRequestId).toBe(cargoRequest1Id);
        });

        it('allows LOGISTICS_MANAGER to compare contracts for another user\'s cargo request', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${lmToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });

        it('returns 404 when the cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: falseUuid });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects comparison by a non-owner PROCUREMENT_MANAGER with 403', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken2}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('rejects comparison by a non-owner VIEWER with 403', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('rejects a malformed cargoRequestId uuid with 400', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: 'not-a-uuid' });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('returns INSUFFICIENT_DATA when neither forecast nor route rate exists', async () => {
            const res = await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest3Id });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INSUFFICIENT_DATA');
        });
    });

    describe('GET /api/contracts/:cargoRequestId', () => {
        it('performs the same stateless comparison and echoes the persisted strategy after a recommendation', async () => {
            // Generate a recommendation via the untouched Phase 2.3 flow
            const recRes = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });
            expect(recRes.status).toBe(201);

            const getRes = await request(app)
                .get(`/api/contracts/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.success).toBe(true);

            const data = getRes.body.data;
            expect(data.cargoRequestId).toBe(cargoRequest1Id);
            expect(data.strategies.map((s) => s.strategy)).toEqual(EXPECTED_STRATEGIES);
            expect(data.selection.status).toBe('NOT_DETERMINED');
            expect(data.basis.policy).toBe(POLICY);
            expect(data.disclaimer).toBe(DISCLAIMER);

            // READ-ONLY echo of what Phase 2.3 persisted ('SPOT' fallback)
            expect(data.persistedRecommendationStrategy).not.toBeNull();
            expect(data.persistedRecommendationStrategy.contractStrategy).toBe('Spot');
            expect(data.persistedRecommendationStrategy.recommendationId).toBe(recRes.body.data.id);
            expect(data.persistedRecommendationStrategy.createdAt).toBeDefined();
        });

        it('returns persistedRecommendationStrategy null when no recommendation exists', async () => {
            const res = await request(app)
                .get(`/api/contracts/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(200);
            expect(res.body.data.persistedRecommendationStrategy).toBeNull();
        });

        it('rejects retrieval by a non-owner with 403', async () => {
            const res = await request(app)
                .get(`/api/contracts/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken2}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('returns 404 when the cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .get(`/api/contracts/${falseUuid}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects a malformed cargoRequestId param with 400', async () => {
            const res = await request(app)
                .get('/api/contracts/not-a-uuid')
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Phase 2.1-2.8 regression compatibility', () => {
        it('keeps the Phase 2.3 recommendation flow untouched', async () => {
            const recRes = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(recRes.status).toBe(201);
            expect(recRes.body.data.contractStrategy).toBe('Spot');
            expect(recRes.body.data.estimatedTotalCost).toBe(13800000.0);
        });

        it('keeps the Phase 2.6 cost flow untouched', async () => {
            const costRes = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(costRes.status).toBe(201);
            expect(costRes.body.data.totalCost).toBe(1337500);
        });

        it('creates no database records from contract endpoints', async () => {
            const breakdownsBefore = (await prisma.costBreakdown.findMany({})).length;
            const recommendationsBefore = (await prisma.recommendation.findMany({})).length;

            await request(app)
                .post('/api/contracts/compare')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            await request(app)
                .get(`/api/contracts/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect((await prisma.costBreakdown.findMany({})).length).toBe(breakdownsBefore);
            expect((await prisma.recommendation.findMany({})).length).toBe(recommendationsBefore);
        });
    });
});