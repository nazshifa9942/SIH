const { prisma } = require('../../config/database');

const AppError = require('../../utils/AppError');

const logger = require('../../config/logger');

const { ROLES } = require('../../utils/roles');

function checkCargoAccess(cargo, user) {
  const isOwner = cargo.userId === user.id;

  const isPrivileged =
    user.role === ROLES.ADMIN ||
    user.role === ROLES.LOGISTICS_MANAGER;

  return isOwner || isPrivileged;
}

async function createWhatIfScenario(user, data) {
  const cargo = await prisma.cargoRequest.findUnique({
    where: {
      id: data.cargoRequestId,
    },
    include: {
      originPort: true,
      destinationPort: true,
    },
  });

  if (!cargo) {
    throw new AppError(
      404,
      'NOT_FOUND',
      'Cargo request not found'
    );
  }

  if (!checkCargoAccess(cargo, user)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Insufficient permissions to create a what-if scenario for this cargo request'
    );
  }

  if (!cargo.originPort || !cargo.destinationPort) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Cargo request ports are missing'
    );
  }

  const originPortId = data.originPortId || cargo.originPortId;
  const destinationPortId = data.destinationPortId || cargo.destinationPortId;
  if (originPortId === destinationPortId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Origin and destination ports cannot be the same');
  }

  const scenario = await prisma.whatIfScenario.create({
    data: {
      cargoRequestId: cargo.id,

      name: data.name,

      description: data.description || null,

      quantityMt: data.quantityMt || cargo.quantityMt,

      requiredDate: data.requiredDate ? new Date(data.requiredDate) : cargo.requiredDate,

      originPortId,

      destinationPortId,

      status: 'DRAFT',
    },

    include: {
      cargoRequest: true,
      originPort: true,
      destinationPort: true,
    },
  });

  logger.info('What-if scenario created', {
    scenarioId: scenario.id,
    cargoRequestId: cargo.id,
    userId: user.id,
  });

  return scenario;
}

async function getScenario(user, id) {
  const scenario = await prisma.whatIfScenario.findUnique({
    where: { id },
    include: { cargoRequest: true, originPort: true, destinationPort: true },
  });
  if (!scenario) throw new AppError(404, 'NOT_FOUND', 'What-if scenario not found');
  if (!checkCargoAccess(scenario.cargoRequest, user)) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to access this scenario');
  return scenario;
}

async function listWhatIfScenarios(user, cargoRequestId) {
  const cargo = await prisma.cargoRequest.findUnique({ where: { id: cargoRequestId } });
  if (!cargo) throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
  if (!checkCargoAccess(cargo, user)) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to access scenarios for this cargo request');
  return prisma.whatIfScenario.findMany({
    where: { cargoRequestId },
    orderBy: { createdAt: 'desc' },
    include: { originPort: true, destinationPort: true },
  });
}

async function updateWhatIfScenario(user, id, data) {
  const scenario = await getScenario(user, id);
  const originPortId = data.originPortId || scenario.originPortId;
  const destinationPortId = data.destinationPortId || scenario.destinationPortId;
  if (originPortId === destinationPortId) throw new AppError(400, 'VALIDATION_ERROR', 'Origin and destination ports cannot be the same');
  return prisma.whatIfScenario.update({
    where: { id },
    data: {
      ...data,
      ...(data.requiredDate ? { requiredDate: new Date(data.requiredDate) } : {}),
      originPortId,
      destinationPortId,
      status: 'DRAFT',
    },
    include: { cargoRequest: true, originPort: true, destinationPort: true },
  });
}

async function deleteWhatIfScenario(user, id) {
  await getScenario(user, id);
  await prisma.whatIfScenario.delete({ where: { id } });
  return { id };
}

async function runWhatIfScenario(user, id) {
  const scenario = await getScenario(user, id);
  const forecast = await prisma.forecastRecord.findFirst({ where: { cargoRequestId: scenario.cargoRequestId }, orderBy: { createdAt: 'desc' } });
  const rate = await prisma.freightRate.findFirst({ where: { originPortId: scenario.originPortId, destinationPortId: scenario.destinationPortId }, orderBy: { observedAt: 'desc' } });
  if (!forecast && !rate) throw new AppError(400, 'INSUFFICIENT_DATA', 'No forecast or freight rate exists for this scenario route');
  const predictions = Array.isArray(forecast?.forecastJson) ? forecast.forecastJson : [];
  const expectedFreight = predictions.length
    ? predictions.reduce((sum, point) => sum + Number(point.predictedRate || 0), 0) / predictions.length
    : Number(rate.rateValue);
  const currentRate = Number(rate?.rateValue || expectedFreight);
  const quantity = Number(scenario.quantityMt);
  const recommendation = expectedFreight > currentRate * 1.02 ? 'CHARTER_NOW' : expectedFreight < currentRate * 0.98 ? 'WAIT' : 'EVALUATE';
  const result = {
    forecast: { expectedFreight, confidence: forecast?.confidence ?? null, horizonDays: predictions.length },
    risk: { overallLevel: forecast?.confidence != null && Number(forecast.confidence) < 0.7 ? 'MEDIUM' : 'LOW' },
    optimization: { status: 'REQUIRES_RECALCULATION' },
    cost: { freightCost: Math.round(expectedFreight * quantity * 100) / 100, totalCost: Math.round(expectedFreight * quantity * 100) / 100 },
    recommendation: { recommendedAction: recommendation, expectedFreight, estimatedTotalCost: Math.round(expectedFreight * quantity * 100) / 100 },
  };
  return prisma.whatIfScenario.update({
    where: { id },
    data: { status: 'COMPLETED', analysisJson: result, forecastJson: result.forecast, riskJson: result.risk, optimizationJson: result.optimization, costJson: result.cost, recommendationJson: result.recommendation },
    include: { cargoRequest: true, originPort: true, destinationPort: true },
  });
}

module.exports = {
  createWhatIfScenario,
  getScenario,
  listWhatIfScenarios,
  updateWhatIfScenario,
  deleteWhatIfScenario,
  runWhatIfScenario,
};