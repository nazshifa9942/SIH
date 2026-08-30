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

const IDLE_POLICY = 'PHASE_2_8_IDLE_MOCK';
const REPOSITIONING_POLICY = 'PHASE_2_8_REPOSITIONING_MOCK';
const ZERO_PLACEHOLDER_LABEL = 'ZERO_PLACEHOLDER_UNDOCUMENTED';

describe('Vessel Idle / Repositioning API', () => {
    let pmToken, adminToken;
    let portAId, portBId;
    let multiWindowVesselId;
    let openEndedVesselId;
    let noAvailabilityVesselId;
    let noCharterCostVesselId;

    beforeEach(async () => {
        resetMarket();
        resetCargo();
        resetPorts();
        resetUsers();
        resetVessels();
        resetVoyagePlans();

        // Register users (any authenticated user may run analyses)
        const pm = await request(app).post('/api/auth/register').send({
            name: 'PM One',
            email: 'pm1@example.com',
            password: 'password123',
            role: 'PROCUREMENT_MANAGER',
        });
        pmToken = pm.body.data.token;

        const admin = await request(app).post('/api/auth/register').send({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'ADMIN',
        });
        adminToken = admin.body.data.token;

        // Ports
        const portA = await prisma.port.create({
            data: { name: 'Port A', country: 'Australia', active: true },
        });
        portAId = portA.id;

        const portB = await prisma.port.create({
            data: { name: 'Port B', country: 'India', active: true },
        });
        portBId = portB.id;

        // Vessel with two closed windows (31 + 10 = 41 idle days) and a
        // latest observation located at 'Newcastle'
        const multiWindow = await prisma.vessel.create({
            data: {
                name: 'Multi Window Vessel',
                vesselType: 'Supramax',
                capacityMt: 55000.0,
                draftM: 12.0,
                loaM: 190.0,
                beamM: 32.0,
                availabilityStatus: 'AVAILABLE',
                dailyCharterCost: 15000.0,
            },
        });
        multiWindowVesselId = multiWindow.id;

        await prisma.vesselAvailability.create({
            data: {
                vesselId: multiWindowVesselId,
                availableFrom: new Date('2026-07-01T00:00:00.000Z'),
                availableUntil: new Date('2026-07-15T00:00:00.000Z'),
                status: 'AVAILABLE',
                currentLocation: 'Singapore',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-01T00:00:00.000Z'),
            },
        });
        await prisma.vesselAvailability.create({
            data: {
                vesselId: multiWindowVesselId,
                availableFrom: new Date('2026-08-01T00:00:00.000Z'),
                availableUntil: new Date('2026-09-01T00:00:00.000Z'),
                status: 'AVAILABLE',
                currentLocation: 'Fremantle',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-05T00:00:00.000Z'),
            },
        });
        await prisma.vesselAvailability.create({
            data: {
                vesselId: multiWindowVesselId,
                availableFrom: new Date('2026-09-10T00:00:00.000Z'),
                availableUntil: new Date('2026-09-20T00:00:00.000Z'),
                status: 'AVAILABLE',
                currentLocation: 'Newcastle',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-10T00:00:00.000Z'),
            },
        });

        // Vessel with one open-ended window only (excluded from idleDays)
        const openEnded = await prisma.vessel.create({
            data: {
                name: 'Open Ended Vessel',
                vesselType: 'Handymax',
                capacityMt: 48000.0,
                draftM: 11.5,
                loaM: 185.0,
                beamM: 30.0,
                availabilityStatus: 'AVAILABLE',
                dailyCharterCost: 12000.0,
            },
        });
        openEndedVesselId = openEnded.id;

        await prisma.vesselAvailability.create({
            data: {
                vesselId: openEndedVesselId,
                availableFrom: new Date('2026-09-01T00:00:00.000Z'),
                availableUntil: null,
                status: 'AVAILABLE',
                currentLocation: 'Paradip',
                source: 'Mock AIS',
                observedAt: new Date('2026-08-06T00:00:00.000Z'),
            },
        });

        // Vessel with no availability observations at all
        const noAvailability = await prisma.vessel.create({
            data: {
                name: 'No Availability Vessel',
                vesselType: 'Panamax',
                capacityMt: 75000.0,
                draftM: 13.5,
                loaM: 225.0,
                beamM: 32.3,
                availabilityStatus: 'UNKNOWN',
                dailyCharterCost: 20000.0,
            },
        });
        noAvailabilityVesselId = noAvailability.id;

        // Vessel without dailyCharterCost and without availability
        const noCharterCost = await prisma.vessel.create({
            data: {
                name: 'No Charter Cost Vessel',
                vesselType: 'Ultramax',
                capacityMt: 60000.0,
                draftM: 12.5,
                loaM: 200.0,
                beamM: 32.0,
                availabilityStatus: 'AVAILABLE',
                dailyCharterCost: null,
            },
        });
        noCharterCostVesselId = noCharterCost.id;
    });

    describe('POST /api/vessels/idle-analysis', () => {
        it('returns the approved shape with closed-window sums and latest location', async () => {
            const res = await request(app)
                .post('/api/vessels/idle-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: multiWindowVesselId });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const data = res.body.data;
            expect(data.status).toBe('EVALUATED');
            expect(data.vessel.id).toBe(multiWindowVesselId);
            expect(data.vessel.name).toBe('Multi Window Vessel');
            expect(data.vessel.availabilityStatus).toBe('AVAILABLE');

            // Latest observation (observedAt DESC) wins
            expect(data.currentLocation).toBe('Newcastle');
            expect(data.availabilityWindowCount).toBe(3);

            // Closed windows ordered by observedAt DESC:
            // Sep 10->20 (10d), Aug 1->Sep 1 (31d), Jul 1->15 (14d) = 55 idle days
            expect(data.closedWindows.length).toBe(3);
            expect(data.closedWindows[0].days).toBeCloseTo(10, 1);
            expect(data.closedWindows[1].days).toBeCloseTo(31, 1);
            expect(data.closedWindows[2].days).toBeCloseTo(14, 1);
            expect(data.openEndedWindows).toEqual([]);
            expect(data.idleDays).toBeCloseTo(55, 1);

            expect(data.basis.policy).toBe(IDLE_POLICY);
        });

        it('excludes open-ended windows from idleDays and reports them separately', async () => {
            const res = await request(app)
                .post('/api/vessels/idle-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: openEndedVesselId });

            expect(res.status).toBe(200);
            const data = res.body.data;
            expect(data.status).toBe('EVALUATED');
            expect(data.currentLocation).toBe('Paradip');
            expect(data.availabilityWindowCount).toBe(1);
            expect(data.closedWindows).toEqual([]);
            expect(data.openEndedWindows.length).toBe(1);
            expect(data.openEndedWindows[0].availableFrom).toBeDefined();
            expect(data.idleDays).toBe(0);
            expect(data.basis.policy).toBe(IDLE_POLICY);
        });

        it('returns INSUFFICIENT_DATA with zeros when the vessel has no availability', async () => {
            const res = await request(app)
                .post('/api/vessels/idle-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: noAvailabilityVesselId });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const data = res.body.data;
            expect(data.status).toBe('INSUFFICIENT_DATA');
            expect(data.currentLocation).toBeNull();
            expect(data.availabilityWindowCount).toBe(0);
            expect(data.closedWindows).toEqual([]);
            expect(data.openEndedWindows).toEqual([]);
            expect(data.idleDays).toBe(0);
            expect(data.basis.policy).toBe(IDLE_POLICY);
        });

        it('rejects an unknown vessel with 404', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .post('/api/vessels/idle-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: falseUuid });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects a malformed vesselId uuid with 400', async () => {
            const res = await request(app)
                .post('/api/vessels/idle-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: 'not-a-uuid' });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/vessels/idle-analysis')
                .send({ vesselId: multiWindowVesselId });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('POST /api/vessels/repositioning-analysis', () => {
        it('returns the approved shape with observational values and labeled placeholders', async () => {
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: multiWindowVesselId, targetPortId: portBId });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const data = res.body.data;
            expect(data.status).toBe('EVALUATED');
            expect(data.vessel.id).toBe(multiWindowVesselId);
            expect(data.currentLocation).toBe('Newcastle');
            expect(data.targetPort).toEqual({
                id: portBId,
                name: 'Port B',
                country: 'India',
            });
            expect(data.locationMatch).toBe(false);

            // Distance is never invented
            expect(data.distance).toEqual({
                status: 'NOT_COMPUTABLE',
                reason: 'NO_DISTANCE_DATA_DOCUMENTED',
            });

            // Cost stays a transparent zero placeholder
            expect(data.estimatedRepositioningCost).toBe(0);
            expect(data.costBasis.status).toBe(ZERO_PLACEHOLDER_LABEL);

            // Descriptive echo of a documented field
            expect(data.referenceDailyCharterCost).toBe(15000.0);

            expect(data.basis.policy).toBe(REPOSITIONING_POLICY);
        });

        it('reports locationMatch true case-insensitively against the target port name', async () => {
            // Latest observation for this vessel is 'Paradip'; create a port
            // named 'paradip' (different case) to prove case-insensitivity.
            const paradip = await prisma.port.create({
                data: { name: 'paradip', country: 'India', active: true },
            });

            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: openEndedVesselId, targetPortId: paradip.id });

            expect(res.status).toBe(200);
            expect(res.body.data.currentLocation).toBe('Paradip');
            expect(res.body.data.locationMatch).toBe(true);
        });

        it('returns locationMatch null when the vessel has no current location', async () => {
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: noAvailabilityVesselId, targetPortId: portBId });

            expect(res.status).toBe(200);
            const data = res.body.data;
            expect(data.status).toBe('INSUFFICIENT_DATA');
            expect(data.currentLocation).toBeNull();
            expect(data.locationMatch).toBeNull();
            expect(data.distance.status).toBe('NOT_COMPUTABLE');
            expect(data.estimatedRepositioningCost).toBe(0);
        });

        it('echoes referenceDailyCharterCost as null when the field is absent', async () => {
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: noCharterCostVesselId, targetPortId: portAId });

            expect(res.status).toBe(200);
            expect(res.body.data.referenceDailyCharterCost).toBeNull();
            expect(res.body.data.estimatedRepositioningCost).toBe(0);
            expect(res.body.data.costBasis.status).toBe(ZERO_PLACEHOLDER_LABEL);
        });

        it('rejects an unknown target port with 404', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999998';
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: multiWindowVesselId, targetPortId: falseUuid });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects an unknown vessel with 404 before touching ports', async () => {
            const falseUuid = '00000000-0000-4000-9000-999999999999';
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: falseUuid, targetPortId: portBId });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });

        it('rejects a malformed body uuid with 400', async () => {
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: 'not-a-uuid', targetPortId: portBId });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('rejects a missing targetPortId with 400', async () => {
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ vesselId: multiWindowVesselId });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app)
                .post('/api/vessels/repositioning-analysis')
                .send({ vesselId: multiWindowVesselId, targetPortId: portBId });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('Phase 2.1-2.7 regression compatibility', () => {
        it('keeps existing vessel endpoints intact (list, get, availability, admin-only create)', async () => {
            const listRes = await request(app)
                .get('/api/vessels')
                .set('Authorization', `Bearer ${pmToken}`);
            expect(listRes.status).toBe(200);
            expect(listRes.body.data.length).toBe(4);

            const getRes = await request(app)
                .get(`/api/vessels/${multiWindowVesselId}`)
                .set('Authorization', `Bearer ${pmToken}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.data.name).toBe('Multi Window Vessel');

            const availRes = await request(app)
                .get(`/api/vessels/${multiWindowVesselId}/availability`)
                .set('Authorization', `Bearer ${pmToken}`);
            expect(availRes.status).toBe(200);
            expect(availRes.body.data.length).toBe(3);

            // Non-admin still cannot create vessels
            const forbiddenCreate = await request(app)
                .post('/api/vessels')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({
                    name: 'Sneaky Vessel',
                    vesselType: 'Supramax',
                    capacityMt: 50000.0,
                    draftM: 12.0,
                    loaM: 190.0,
                    beamM: 32.0,
                    availabilityStatus: 'AVAILABLE',
                });
            expect(forbiddenCreate.status).toBe(403);

            // Admin can still create vessels
            const adminCreate = await request(app)
                .post('/api/vessels')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Admin Vessel',
                    vesselType: 'Supramax',
                    capacityMt: 50000.0,
                    draftM: 12.0,
                    loaM: 190.0,
                    beamM: 32.0,
                    availabilityStatus: 'AVAILABLE',
                });
            expect(adminCreate.status).toBe(201);
        });

        it('leaves the recommendation and cost flows untouched', async () => {
            // Seed minimal data for the Phase 2.3 flow on route A -> B
            const cargo = await prisma.cargoRequest.create({
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

            await prisma.forecastRecord.create({
                data: {
                    cargoRequestId: cargo.id,
                    modelVersion: 'freight-v1-mock',
                    forecastJson: [
                        { date: '2026-09-02', predictedRate: 26.5 },
                        { date: '2026-09-03', predictedRate: 27.0 },
                    ],
                    confidence: 0.85,
                },
            });

            const recRes = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ cargoRequestId: cargo.id });

            expect(recRes.status).toBe(201);
            expect(recRes.body.data.estimatedTotalCost).toBe(13800000.0);

            const costRes = await request(app)
                .post('/api/cost/estimate')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({ cargoRequestId: cargo.id });

            expect(costRes.status).toBe(201);
            expect(costRes.body.data.totalCost).toBe(1337500);
        });
    });
});