jest.mock('../../src/config/database', () => require('../mocks/database'));

const request = require('supertest');
const {
    prisma,
    resetMarket,
    resetCargo,
    resetPorts,
    resetUsers,
    resetVessels,
} = require('../mocks/database');
const createApp = require('../../src/app');

const app = createApp();

const DISCLAIMER = 'Risk is an estimate, not a guarantee.';
const POLICY_LABEL = 'PHASE_2_7_CONSERVATIVE_MOCK';

describe('Risk API', () => {
    let pmToken1, pmToken2, viewerToken, adminToken, lmToken;
    let portAId, portBId, portCId;
    let cargoRequest1Id, cargoRequest2Id, cargoRequest3Id, cargoRequest4Id, cargoRequest5Id;

    beforeEach(async () => {
        resetMarket();
        resetCargo();
        resetPorts();
        resetUsers();
        resetVessels();

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

        // Cargo 1: Owner PM1, route A->B, forecast confidence 0.85 => LOW
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

        // Cargo 2: Owner PM2, route A->B, forecast confidence 0.55 => MEDIUM
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

        // Cargo 3: Owner PM1, route A->B, NO forecast (route rate exists)
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

        // Cargo 4: Owner PM1, route B->C, NO forecast and NO route rate
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

        // Cargo 5: Owner PM1, route B->C, forecast confidence 0.9 (passes gate,
        // used to exercise degraded factors on a data-less route)
        const cargo5 = await prisma.cargoRequest.create({
            data: {
                userId: '00000000-0000-4000-8000-000000000001',
                cargoType: 'Iron Ore',
                quantityMt: 25000.0,
                originPortId: portBId,
                destinationPortId: portCId,
                requiredDate: new Date('2026-12-20T00:00:00.000Z'),
                status: 'DRAFT',
            },
        });
        cargoRequest5Id = cargo5.id;

        // Freight rates on route A->B only (latest 25.0, min 22.5, max 27.0)
        await prisma.freightRate.create({
            data: {
                observedAt: new Date('2026-08-01T12:00:00.000Z'),
                originPortId: portAId,
                destinationPortId: portBId,
                vesselType: 'Supramax',
                rateValue: 22.5,
                currency: 'USD',
                rateUnit: 'MT',
                source: 'Baltic Index',
            },
        });
        await prisma.freightRate.create({
            data: {
                observedAt: new Date('2026-08-10T12:00:00.000Z'),
                originPortId: portAId,
                destinationPortId: portBId,
                vesselType: 'Supramax',
                rateValue: 27.0,
                currency: 'USD',
                rateUnit: 'MT',
                source: 'Baltic Index',
            },
        });
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
                cargoRequestId: cargoRequest2Id,
                modelVersion: 'freight-v1-mock',
                forecastJson: [{ date: '2026-09-02', predictedRate: 24.0 }],
                confidence: 0.55,
            },
        });
        await prisma.forecastRecord.create({
            data: {
                cargoRequestId: cargoRequest5Id,
                modelVersion: 'freight-v1-mock',
                forecastJson: [{ date: '2026-09-02', predictedRate: 30.0 }],
                confidence: 0.9,
            },
        });

        // Weather observation matching destination Port B by name (benign)
        await prisma.weatherObservation.create({
            data: {
                observedAt: new Date('2026-08-18T06:00:00.000Z'),
                location: 'Port B',
                windSpeed: 18.2,
                rainfall: 40.0,
                stormIndicator: false,
                severity: null,
                source: 'Mock Weather Feed',
            },
        });

        // Vessels: 2 AVAILABLE + 1 CHARTERED, 4 availability windows
        const vessel1 = await prisma.vessel.create({
            data: {
                name: 'Vessel One',
                vesselType: 'Supramax',
                capacityMt: 55000.0,
                draftM: 12.0,
                loaM: 190.0,
                beamM: 32.0,
                availabilityStatus: 'AVAILABLE',
            },
        });
        const vessel2 = await prisma.vessel.create({
            data: {
                name: 'Vessel Two',
                vesselType: 'Handymax',
                capacityMt: 48000.0,
                draftM: 11.5,
                loaM: 185.0,
                beamM: 30.0,
                availabilityStatus: 'AVAILABLE',
            },
        });
        const vessel3 = await prisma.vessel.create({
            data: {
                name: 'Vessel Three',
                vesselType: 'Panamax',
                capacityMt: 75000.0,
                draftM: 13.5,
                loaM: 225.0,
                beamM: 32.3,
                availabilityStatus: 'CHARTERED',
            },
        });

        await prisma.vesselAvailability.create({
            data: {
                vesselId: vessel1.id,
                availableFrom: new Date('2026-09-01T00:00:00.000Z'),
                availableUntil: new Date('2026-10-01T00:00:00.000Z'),
                status: 'AVAILABLE',
                currentLocation: 'Singapore',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-15T00:00:00.000Z'),
            },
        });
        await prisma.vesselAvailability.create({
            data: {
                vesselId: vessel1.id,
                availableFrom: new Date('2026-10-05T00:00:00.000Z'),
                availableUntil: null,
                status: 'AVAILABLE',
                currentLocation: 'Paradip',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-16T00:00:00.000Z'),
            },
        });
        await prisma.vesselAvailability.create({
            data: {
                vesselId: vessel2.id,
                availableFrom: new Date('2026-09-10T00:00:00.000Z'),
                availableUntil: new Date('2026-11-10T00:00:00.000Z'),
                status: 'AVAILABLE',
                currentLocation: 'Fremantle',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-14T00:00:00.000Z'),
            },
        });
        await prisma.vesselAvailability.create({
            data: {
                vesselId: vessel3.id,
                availableFrom: new Date('2026-12-01T00:00:00.000Z'),
                availableUntil: null,
                status: 'CHARTERED',
                currentLocation: 'Newcastle',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-17T00:00:00.000Z'),
            },
        });
    });

    describe('POST /api/risk/analyze', () => {
        it('returns the full approved assessment shape for the owner (LOW baseline)', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const data = res.body.data;
            expect(data.cargoRequestId).toBe(cargoRequest1Id);
            expect(data.assessedAt).toBeDefined();

            // Option A aggregation
            expect(data.overallLevel).toBe('LOW');
            expect(data.reviewRequired).toBe(false);
            expect(data.basis.forecastConfidence).toBe(0.85);
            expect(data.basis.confidenceEscalationApplied).toBe(false);
            expect(data.basis.aggregationPolicy).toBe(POLICY_LABEL);

            // Verbatim documented disclaimer
            expect(data.disclaimer).toBe(DISCLAIMER);

            // Five documented factors
            expect(Object.keys(data.factors).sort()).toEqual(
                ['congestion', 'eventSignals', 'freightVolatility', 'vesselAvailability', 'weather'].sort()
            );

            // Congestion: nothing seeded in this test -> degraded gracefully
            expect(data.factors.congestion.status).toBe('INSUFFICIENT_DATA');

            // Weather matched by destination port name
            expect(data.factors.weather.status).toBe('EVALUATED');
            expect(data.factors.weather.observation.location).toBe('Port B');
            expect(data.factors.weather.observation.stormIndicator).toBe(false);
            expect(data.factors.weather.observation.severity).toBeNull();

            // Freight volatility descriptive stats
            expect(data.factors.freightVolatility.status).toBe('EVALUATED');
            expect(data.factors.freightVolatility.observationCount).toBe(3);
            expect(data.factors.freightVolatility.latestRate).toBe(25.0);
            expect(data.factors.freightVolatility.minRate).toBe(22.5);
            expect(data.factors.freightVolatility.maxRate).toBe(27.0);
            expect(data.factors.freightVolatility.forecastSpread).toEqual({ min: 26.5, max: 27.0 });

            // Vessel availability counts
            expect(data.factors.vesselAvailability.status).toBe('EVALUATED');
            expect(data.factors.vesselAvailability.vesselsByStatus).toEqual({
                AVAILABLE: 2,
                CHARTERED: 1,
            });
            expect(data.factors.vesselAvailability.availabilityWindowCount).toBe(4);

            // Event signals: catalog UNSPECIFIED
            expect(data.factors.eventSignals.status).toBe('NOT_EVALUABLE');
            expect(data.factors.eventSignals.reason).toBe('NO_APPROVED_EVENT_SIGNAL_CATALOG_DOCUMENTED');

            // No numeric risk score anywhere in the response
            expect(data.riskScore).toBeUndefined();
            expect(data.score).toBeUndefined();
        });

        it('reports changing congestion with deltas when two observations exist', async () => {
            await prisma.portCongestion.create({
                data: {
                    observedAt: new Date('2026-08-01T00:00:00.000Z'),
                    portId: portAId,
                    vesselsWaiting: 2,
                    avgWaitHours: 3.0,
                    congestionIndex: 0.38,
                    source: 'Mock Feed',
                },
            });
            await prisma.portCongestion.create({
                data: {
                    observedAt: new Date('2026-08-19T00:00:00.000Z'),
                    portId: portAId,
                    vesselsWaiting: 4,
                    avgWaitHours: 6.5,
                    congestionIndex: 0.42,
                    source: 'Mock Feed',
                },
            });
            await prisma.portCongestion.create({
                data: {
                    observedAt: new Date('2026-08-19T00:00:00.000Z'),
                    portId: portBId,
                    vesselsWaiting: 7,
                    avgWaitHours: 9.0,
                    congestionIndex: 0.61,
                    source: 'Mock Feed',
                },
            });

            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            const congestion = res.body.data.factors.congestion;
            expect(congestion.status).toBe('EVALUATED');
            expect(congestion.origin.congestionIndex).toBe(0.42);
            expect(congestion.origin.avgWaitHours).toBe(6.5);
            expect(congestion.origin.vesselsWaiting).toBe(4);
            expect(congestion.destination.congestionIndex).toBe(0.61);
            expect(congestion.change.originDelta).toBeCloseTo(0.04, 4);
            // Single observation on destination -> delta null (absence != stability)
            expect(congestion.change.destinationDelta).toBeNull();
        });

        it('keeps overallLevel LOW regardless of congestion values (no invented thresholds)', async () => {
            await prisma.portCongestion.create({
                data: {
                    observedAt: new Date('2026-08-19T00:00:00.000Z'),
                    portId: portAId,
                    vesselsWaiting: 50,
                    avgWaitHours: 72.0,
                    congestionIndex: 0.99,
                    source: 'Mock Feed',
                },
            });
            await prisma.portCongestion.create({
                data: {
                    observedAt: new Date('2026-08-19T00:00:00.000Z'),
                    portId: portBId,
                    vesselsWaiting: 60,
                    avgWaitHours: 96.0,
                    congestionIndex: 0.99,
                    source: 'Mock Feed',
                },
            });

            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.data.overallLevel).toBe('LOW');
            expect(res.body.data.reviewRequired).toBe(false);
        });

        it('escalates to MEDIUM only when latest forecast confidence < 0.7', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken2}`)
                .send({ cargoRequestId: cargoRequest2Id });

            expect(res.status).toBe(200);
            expect(res.body.data.overallLevel).toBe('MEDIUM');
            expect(res.body.data.reviewRequired).toBe(false);
            expect(res.body.data.basis.forecastConfidence).toBe(0.55);
            expect(res.body.data.basis.confidenceEscalationApplied).toBe(true);
        });

        it('never produces HIGH even with extreme observations (HIGH unreachable)', async () => {
            await prisma.portCongestion.create({
                data: {
                    observedAt: new Date('2026-08-19T00:00:00.000Z'),
                    portId: portBId,
                    vesselsWaiting: 99,
                    avgWaitHours: 120.0,
                    congestionIndex: 1.0,
                    source: 'Mock Feed',
                },
            });
            await prisma.weatherObservation.create({
                data: {
                    observedAt: new Date('2026-08-20T00:00:00.000Z'),
                    location: 'Port B',
                    windSpeed: 120.0,
                    rainfall: 900.0,
                    stormIndicator: true,
                    severity: 'EXTREME',
                    source: 'Mock Weather Feed',
                },
            });

            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.data.overallLevel).toBe('LOW');
            expect(res.body.data.reviewRequired).toBe(false);

            // Storm observation is reported transparently, never mapped to level
            expect(res.body.data.factors.weather.observation.stormIndicator).toBe(true);
            expect(res.body.data.factors.weather.observation.severity).toBe('EXTREME');
        });

        it('degrades weather to INSUFFICIENT_DATA when no observation matches the destination port', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest5Id });

            expect(res.status).toBe(200);
            expect(res.body.data.factors.weather.status).toBe('INSUFFICIENT_DATA');
            expect(res.body.data.factors.weather.observation).toBeNull();
            expect(res.body.data.overallLevel).toBe('LOW');
        });

        it('succeeds without a forecast when a route freight rate exists (gate parity)', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest3Id });

            expect(res.status).toBe(200);
            expect(res.body.data.overallLevel).toBe('LOW');
            expect(res.body.data.basis.forecastConfidence).toBeNull();
            expect(res.body.data.basis.confidenceEscalationApplied).toBe(false);
            expect(res.body.data.factors.freightVolatility.forecastSpread).toBeNull();
        });

        it('allows ADMIN to analyze risk for another user\'s cargo request', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.cargoRequestId).toBe(cargoRequest1Id);
        });

        it('allows LOGISTICS_MANAGER to analyze risk for another user\'s cargo request', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${lmToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });

        it('returns 404 when the cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: falseUuid });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects analysis by a non-owner PROCUREMENT_MANAGER with 403', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken2}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('rejects analysis by a non-owner VIEWER with 403', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('rejects a malformed cargoRequestId uuid with 400', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: 'not-a-uuid' });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('returns INSUFFICIENT_DATA when there is no forecast and no route freight rate', async () => {
            const res = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest4Id });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INSUFFICIENT_DATA');
        });
    });

    describe('GET /api/risk/:cargoRequestId', () => {
        it('returns an equivalent assessment for the owner (stateless recompute)', async () => {
            const postRes = await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            const getRes = await request(app)
                .get(`/api/risk/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.success).toBe(true);
            expect(getRes.body.data.cargoRequestId).toBe(cargoRequest1Id);
            expect(getRes.body.data.overallLevel).toBe(postRes.body.data.overallLevel);
            expect(getRes.body.data.disclaimer).toBe(DISCLAIMER);
            expect(getRes.body.data.basis.aggregationPolicy).toBe(POLICY_LABEL);
            expect(getRes.body.data.factors.freightVolatility.latestRate).toBe(25.0);
        });

        it('rejects retrieval by a non-owner with 403', async () => {
            const res = await request(app)
                .get(`/api/risk/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken2}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });

        it('returns 404 when the cargo request does not exist', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .get(`/api/risk/${falseUuid}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects a malformed cargoRequestId param with 400', async () => {
            const res = await request(app)
                .get('/api/risk/not-a-uuid')
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('returns INSUFFICIENT_DATA in parity with POST when no freight signal exists', async () => {
            const res = await request(app)
                .get(`/api/risk/${cargoRequest4Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('INSUFFICIENT_DATA');
        });
    });

    describe('Phase 2.1-2.6 regression compatibility', () => {
        it('leaves the Phase 2.3 recommendation flow and its own risk logic untouched', async () => {
            const recRes = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            expect(recRes.status).toBe(201);
            expect(recRes.body.data.recommendedAction).toBe('CHARTER_NOW');
            expect(recRes.body.data.riskLevel).toBe('LOW');
            expect(recRes.body.data.estimatedTotalCost).toBe(13800000.0);
        });

        it('persists no risk assessments and creates no alert records', async () => {
            await request(app)
                .post('/api/risk/analyze')
                .set('Authorization', `Bearer ${pmToken1}`)
                .send({ cargoRequestId: cargoRequest1Id });

            await request(app)
                .get(`/api/risk/${cargoRequest1Id}`)
                .set('Authorization', `Bearer ${pmToken1}`);

            // No persistence layer exists for risk; alerts remain untouched.
            const alerts = await prisma.alert.findMany({});
            expect(alerts).toEqual([]);
        });
    });
});