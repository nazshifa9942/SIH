const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');

async function createPort(data) {
    const port = await prisma.port.create({
        data: {
            name: data.name,
            country: data.country,
            region: data.region || null,
            maxDraftM: data.maxDraftM,
            maxLoaM: data.maxLoaM,
            maxBeamM: data.maxBeamM,
            handlingCapacityMtDay: data.handlingCapacityMtDay,
            berthCapacity: data.berthCapacity,
            active: data.active !== undefined ? data.active : true,
        },
    });

    logger.info('Port created', { portId: port.id, name: port.name });
    return port;
}

async function listPorts(filters = {}) {
    const where = {};
    if (filters.country) {
        where.country = { contains: filters.country, mode: 'insensitive' };
    }
    if (filters.region) {
        where.region = { contains: filters.region, mode: 'insensitive' };
    }
    if (filters.active !== undefined) {
        where.active = filters.active === 'true' || filters.active === true;
    }

    const ports = await prisma.port.findMany({ where });
    return ports;
}

async function getPortById(id) {
    const port = await prisma.port.findUnique({
        where: { id },
    });

    if (!port) {
        throw new AppError(404, 'NOT_FOUND', 'Port not found');
    }

    return port;
}

async function updatePort(id, data) {
    // Check if port exists
    const existing = await prisma.port.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Port not found');
    }

    const port = await prisma.port.update({
        where: { id },
        data,
    });

    logger.info('Port updated', { portId: port.id });
    return port;
}

module.exports = {
    createPort,
    listPorts,
    getPortById,
    updatePort,
};
