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

async function seedConstrainedPort(name, country, limits) {
  return prisma.port.create({
    data: {
      name,
      country,
      active: true,
      maxDraftM: limits.maxDraftM,
      maxLoaM: limits.maxLoaM,
      maxBeamM: limits.maxBeamM,
      handlingCapacityMtDay: 50000,
      berthCapacity: 4,
    },
  });
}

describe('Optimization Vessel Plan API', () => {
  let pmToken1;
  let pmToken2;
  let adminToken;
  let logisticsToken;
  let originPort;
  let destPort;
  let cargoRequest1Id;
  let cargoRequest2Id;

  beforeEach(async () => {
    resetMarket();
    resetCargo();
    resetPorts();
    resetUsers();
    resetVessels();
    resetVoyagePlans();

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

    const admin = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN',
    });
    adminToken = admin.body.data.token;

    const logistics = await request(app).post('/api/auth/register').send({
      name: 'Logistics User',
      email: 'logistics@example.com',
      password: 'password123',
      role: 'LOGISTICS_MANAGER',
    });
    logisticsToken = logistics.body.data.token;

    originPort = await seedConstrainedPort('Origin Port', 'Australia', {
      maxDraftM: 16,
      maxLoaM: 230,
      maxBeamM: 40,
    });
    destPort = await seedConstrainedPort('Dest Port', 'India', {
      maxDraftM: 16,
      maxLoaM: 230,
      maxBeamM: 40,
    });

    const cargo1 = await prisma.cargoRequest.create({
      data: {
        userId: '00000000-0000-4000-8000-000000000001',
        cargoType: 'Coal',
        quantityMt: 50000,
        originPortId: originPort.id,
        destinationPortId: destPort.id,
        requiredDate: new Date('2026-10-15T00:00:00.000Z'),
        status: 'DRAFT',
      },
    });
    cargoRequest1Id = cargo1.id;

    const cargo2 = await prisma.cargoRequest.create({
      data: {
        userId: '00000000-0000-4000-8000-000000000002',
        cargoType: 'Coal',
        quantityMt: 45000,
        originPortId: originPort.id,
        destinationPortId: destPort.id,
        requiredDate: new Date('2026-11-20T00:00:00.000Z'),
        status: 'DRAFT',
      },
    });
    cargoRequest2Id = cargo2.id;
  });

  describe('POST /api/optimization/vessel-plan', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).post('/api/optimization/vessel-plan').send({
        cargoRequestId: cargoRequest1Id,
      });
      expect(res.status).toBe(401);
    });

    it('rejects non-owner procurement manager', async () => {
      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest2Id });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 for missing cargo', async () => {
      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: '00000000-0000-4000-9000-999999999999' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid cargoRequestId', async () => {
      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: 'not-a-uuid' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('succeeds for cargo owner', async () => {
      await prisma.vessel.create({
        data: {
          name: 'Feasible One',
          vesselType: 'Supramax',
          capacityMt: 50000,
          draftM: 12,
          loaM: 190,
          beamM: 32,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feasible).toBe(true);
    });

    it('succeeds for admin', async () => {
      await prisma.vessel.create({
        data: {
          name: 'Feasible Admin',
          vesselType: 'Supramax',
          capacityMt: 50000,
          draftM: 12,
          loaM: 190,
          beamM: 32,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cargoRequestId: cargoRequest2Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(true);
    });

    it('succeeds for logistics manager', async () => {
      await prisma.vessel.create({
        data: {
          name: 'Feasible Logistics',
          vesselType: 'Supramax',
          capacityMt: 50000,
          draftM: 12,
          loaM: 190,
          beamM: 32,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(true);
    });

    it('creates a single trip when capacity covers cargo quantity', async () => {
      const vessel = await prisma.vessel.create({
        data: {
          name: 'Large Vessel',
          vesselType: 'Panamax',
          capacityMt: 60000,
          draftM: 12,
          loaM: 190,
          beamM: 32,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(true);
      expect(res.body.data.numberOfTrips).toBe(1);
      expect(res.body.data.recommendedPlan).toHaveLength(1);
      expect(res.body.data.recommendedPlan[0].tripNumber).toBe(1);
      expect(res.body.data.recommendedPlan[0].quantityMT).toBe(50000);
      expect(res.body.data.recommendedPlan[0].vesselId).toBe(vessel.id);
      expect(res.body.data.voyagePlans).toHaveLength(1);
      expect(res.body.data.voyagePlans[0].feasibilityStatus).toBe('FEASIBLE');
      expect(res.body.data.totalEstimatedCost).toBe(13800000);
    });

    it('creates sequential multi-trips whose quantities sum to cargo quantity', async () => {
      const vessel = await prisma.vessel.create({
        data: {
          name: 'Smaller Vessel',
          vesselType: 'Handymax',
          capacityMt: 20000,
          draftM: 11,
          loaM: 180,
          beamM: 30,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(true);
      expect(res.body.data.numberOfTrips).toBe(3);
      expect(res.body.data.recommendedPlan.map((trip) => trip.tripNumber)).toEqual([1, 2, 3]);
      expect(res.body.data.recommendedPlan.map((trip) => trip.vesselId)).toEqual([
        vessel.id,
        vessel.id,
        vessel.id,
      ]);
      const quantitySum = res.body.data.recommendedPlan.reduce(
        (sum, trip) => sum + trip.quantityMT,
        0
      );
      expect(quantitySum).toBe(50000);
      expect(res.body.data.recommendedPlan[0].quantityMT).toBe(20000);
      expect(res.body.data.recommendedPlan[1].quantityMT).toBe(20000);
      expect(res.body.data.recommendedPlan[2].quantityMT).toBe(10000);
      expect(res.body.data.voyagePlans).toHaveLength(3);
      expect(res.body.data.voyagePlans.every((plan) => plan.feasibilityStatus === 'FEASIBLE')).toBe(
        true
      );
    });

    it('accepts feasible draft, LOA, and beam against both ports', async () => {
      await prisma.vessel.create({
        data: {
          name: 'Within Limits',
          vesselType: 'Supramax',
          capacityMt: 50000,
          draftM: 16,
          loaM: 230,
          beamM: 40,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(true);
      const failed = (res.body.data.constraintChecks || []).filter((check) => !check.passed);
      expect(failed).toHaveLength(0);
    });

    it('marks plan infeasible when draft exceeds destination limit', async () => {
      await prisma.vessel.create({
        data: {
          name: 'Deep Draft',
          vesselType: 'Capesize',
          capacityMt: 80000,
          draftM: 18,
          loaM: 190,
          beamM: 32,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(false);
      expect(res.body.data.recommendedPlan).toEqual([]);
      expect(res.body.data.numberOfTrips).toBe(0);
      expect(res.body.data.voyagePlans).toEqual([]);
      expect(res.body.data.constraintChecks.some((check) => check.code === 'DRAFT' && !check.passed)).toBe(
        true
      );
    });

    it('marks plan infeasible when LOA exceeds port limit', async () => {
      await prisma.vessel.create({
        data: {
          name: 'Too Long',
          vesselType: 'Capesize',
          capacityMt: 80000,
          draftM: 12,
          loaM: 260,
          beamM: 32,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(false);
      expect(res.body.data.voyagePlans).toEqual([]);
      expect(res.body.data.constraintChecks.some((check) => check.code === 'LOA' && !check.passed)).toBe(
        true
      );
    });

    it('marks plan infeasible when beam exceeds port limit', async () => {
      await prisma.vessel.create({
        data: {
          name: 'Too Wide',
          vesselType: 'Capesize',
          capacityMt: 80000,
          draftM: 12,
          loaM: 190,
          beamM: 45,
          availabilityStatus: 'AVAILABLE',
        },
      });

      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(false);
      expect(res.body.data.voyagePlans).toEqual([]);
      expect(res.body.data.constraintChecks.some((check) => check.code === 'BEAM' && !check.passed)).toBe(
        true
      );
    });

    it('returns feasible false when the vessel pool is empty', async () => {
      const res = await request(app)
        .post('/api/optimization/vessel-plan')
        .set('Authorization', `Bearer ${pmToken1}`)
        .send({ cargoRequestId: cargoRequest1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.feasible).toBe(false);
      expect(res.body.data.recommendedPlan).toEqual([]);
      expect(res.body.data.numberOfTrips).toBe(0);
      expect(res.body.data.voyagePlans).toEqual([]);
    });
  });
});
