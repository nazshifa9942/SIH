const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');
const { getOptimizationClient } = require('../../integrations/optimization/optimization.client');
const { evaluateCandidates } = require('../feasibility/portFeasibility.service');

function checkCargoAccess(cargo, user) {
  const isOwner = cargo.userId === user.id;
  const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
  return isOwner || isPrivileged;
}

function validateOptimizationResponse(result) {
  if (
    !result ||
    typeof result.feasible !== 'boolean' ||
    !Array.isArray(result.recommendedPlan) ||
    typeof result.numberOfTrips !== 'number'
  ) {
    throw new AppError(502, 'INTEGRATION_ERROR', 'Invalid optimization service response');
  }
}

async function createVesselPlan(user, data) {
  const cargo = await prisma.cargoRequest.findUnique({
    where: { id: data.cargoRequestId },
    include: {
      originPort: true,
      destinationPort: true,
    },
  });

  if (!cargo) {
    throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
  }

  if (!checkCargoAccess(cargo, user)) {
    throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to plan vessels for this cargo request');
  }

  const originPort = cargo.originPort;
  const destinationPort = cargo.destinationPort;

  if (!originPort || !destinationPort) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Cargo request ports are missing');
  }

  const vessels = await prisma.vessel.findMany();
  const availability = await Promise.all(
    vessels.map((vessel) =>
      prisma.vesselAvailability.findMany({
        where: { vesselId: vessel.id },
        orderBy: { observedAt: 'desc' },
      })
    )
  );

  const latestForecast = await prisma.forecastRecord.findFirst({
    where: { cargoRequestId: cargo.id },
    orderBy: { createdAt: 'desc' },
  });

  const [originCongestion, destinationCongestion] = await Promise.all([
    prisma.portCongestion.findFirst({
      where: { portId: originPort.id },
      orderBy: { observedAt: 'desc' },
    }),
    prisma.portCongestion.findFirst({
      where: { portId: destinationPort.id },
      orderBy: { observedAt: 'desc' },
    }),
  ]);

  const { feasibleVessels, constraintChecks } = evaluateCandidates(
    vessels,
    originPort,
    destinationPort
  );

  const assembledInput = {
    cargo,
    originPort,
    destinationPort,
    vessels,
    availability: availability.flat(),
    forecast: latestForecast || null,
    originCongestion: originCongestion || null,
    destinationCongestion: destinationCongestion || null,
    feasibleVessels,
    constraintChecks,
  };

  const client = getOptimizationClient();
  const optResult = await client.planVesselPlan(assembledInput);
  validateOptimizationResponse(optResult);

  await prisma.voyagePlan.deleteMany({
    where: { cargoRequestId: cargo.id },
  });

  const feasibilityStatus = optResult.feasible ? 'FEASIBLE' : 'INFEASIBLE';
  const voyagePlans = [];

  if (optResult.feasible) {
    for (const trip of optResult.recommendedPlan) {
      const created = await prisma.voyagePlan.create({
        data: {
          cargoRequestId: cargo.id,
          vesselId: trip.vesselId,
          originPortId: originPort.id,
          destinationPortId: destinationPort.id,
          tripNumber: trip.tripNumber,
          plannedQuantityMt: trip.quantityMT,
          eta: null,
          estimatedCost: optResult.totalEstimatedCost,
          feasibilityStatus,
        },
      });
      voyagePlans.push(created);
    }
  }

  logger.info('Vessel plan generated', {
    cargoRequestId: cargo.id,
    feasible: optResult.feasible,
    numberOfTrips: optResult.numberOfTrips,
    voyagePlanCount: voyagePlans.length,
  });

  return {
    feasible: optResult.feasible,
    recommendedPlan: optResult.recommendedPlan,
    numberOfTrips: optResult.numberOfTrips,
    totalEstimatedCost: optResult.totalEstimatedCost,
    constraintChecks: optResult.constraintChecks || [],
    alternatives: optResult.alternatives || [],
    voyagePlans,
  };
}

module.exports = {
  createVesselPlan,
};
