const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');

function checkCargoAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
    return isOwner || isPrivileged;
}

async function validatePorts(originPortId, destinationPortId) {
    if (originPortId === destinationPortId) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Origin and destination ports cannot be the same');
    }

    const [originPort, destPort] = await Promise.all([
        prisma.port.findUnique({ where: { id: originPortId } }),
        prisma.port.findUnique({ where: { id: destinationPortId } }),
    ]);

    if (!originPort) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Origin port does not exist');
    }

    if (!destPort) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Destination port does not exist');
    }
}

async function createCargo(userId, data) {
    await validatePorts(data.originPortId, data.destinationPortId);

    const cargo = await prisma.cargoRequest.create({
        data: {
            userId,
            cargoType: data.cargoType,
            quantityMt: data.quantityMt,
            originPortId: data.originPortId,
            destinationPortId: data.destinationPortId,
            requiredDate: new Date(data.requiredDate),
            contractDuration: data.contractDuration || null,
            status: 'DRAFT',
        },
        include: {
            originPort: true,
            destinationPort: true,
        },
    });

    logger.info('Cargo request created', { cargoId: cargo.id, userId });
    return cargo;
}

async function listCargo(user, filters = {}) {
    const where = {};

    // Access control filter
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
    if (!isPrivileged) {
        where.userId = user.id;
    } else if (filters.userId) {
        where.userId = filters.userId;
    }

    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.cargoType) {
        where.cargoType = { contains: filters.cargoType, mode: 'insensitive' };
    }

    const cargoRequests = await prisma.cargoRequest.findMany({
        where,
        include: {
            originPort: true,
            destinationPort: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return cargoRequests;
}

async function getCargoById(id, user) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id },
        include: {
            originPort: true,
            destinationPort: true,
        },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkCargoAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to access this cargo request');
    }

    return cargo;
}

async function updateCargo(id, user, data) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    // Only the creator (owner) or an ADMIN can update
    const isOwner = cargo.userId === user.id;
    const isAdmin = user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to update this cargo request');
    }

    // If port changes are requested, validate them
    const newOrigin = data.originPortId || cargo.originPortId;
    const newDest = data.destinationPortId || cargo.destinationPortId;

    if (data.originPortId || data.destinationPortId) {
        await validatePorts(newOrigin, newDest);
    }

    const updateData = { ...data };
    if (data.requiredDate) {
        updateData.requiredDate = new Date(data.requiredDate);
    }

    const updatedCargo = await prisma.cargoRequest.update({
        where: { id },
        data: updateData,
        include: {
            originPort: true,
            destinationPort: true,
        },
    });

    logger.info('Cargo request updated', { cargoId: id, userId: user.id });
    return updatedCargo;
}

async function deleteCargo(id, user) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    // Only the creator (owner) or an ADMIN can delete
    const isOwner = cargo.userId === user.id;
    const isAdmin = user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to delete this cargo request');
    }

    await prisma.cargoRequest.delete({
        where: { id },
    });

    logger.info('Cargo request deleted', { cargoId: id, userId: user.id });
    return { id };
}

module.exports = {
    createCargo,
    listCargo,
    getCargoById,
    updateCargo,
    deleteCargo,
};
