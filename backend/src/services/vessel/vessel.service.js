const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');

async function createVessel(data) {
  const vessel = await prisma.vessel.create({
    data: {
      name: data.name,
      vesselType: data.vesselType,
      capacityMt: data.capacityMt,
      draftM: data.draftM,
      loaM: data.loaM,
      beamM: data.beamM,
      speedKnots: data.speedKnots !== undefined ? data.speedKnots : null,
      fuelConsumption: data.fuelConsumption !== undefined ? data.fuelConsumption : null,
      dailyCharterCost: data.dailyCharterCost !== undefined ? data.dailyCharterCost : null,
      availabilityStatus: data.availabilityStatus,
    },
  });

  logger.info('Vessel created', { vesselId: vessel.id, name: vessel.name });
  return vessel;
}

async function listVessels(filters = {}) {
  const where = {};
  if (filters.vesselType) {
    where.vesselType = filters.vesselType;
  }
  if (filters.availabilityStatus) {
    where.availabilityStatus = filters.availabilityStatus;
  }

  return prisma.vessel.findMany({ where });
}

async function getVesselById(id) {
  const vessel = await prisma.vessel.findUnique({
    where: { id },
  });

  if (!vessel) {
    throw new AppError(404, 'NOT_FOUND', 'Vessel not found');
  }

  return vessel;
}

async function updateVessel(id, data) {
  const existing = await prisma.vessel.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Vessel not found');
  }

  const vessel = await prisma.vessel.update({
    where: { id },
    data,
  });

  logger.info('Vessel updated', { vesselId: vessel.id });
  return vessel;
}

async function getVesselAvailability(id) {
  const vessel = await prisma.vessel.findUnique({ where: { id } });
  if (!vessel) {
    throw new AppError(404, 'NOT_FOUND', 'Vessel not found');
  }

  return prisma.vesselAvailability.findMany({
    where: { vesselId: id },
    orderBy: { observedAt: 'desc' },
  });
}

module.exports = {
  createVessel,
  listVessels,
  getVesselById,
  updateVessel,
  getVesselAvailability,
};
