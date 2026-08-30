const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { getMlClient } = require('../../integrations/ml/ml.client');
const { ROLES } = require('../../utils/roles');

function checkForecastAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
    return isOwner || isPrivileged;
}

function getSeason(date) {
    const month = new Date(date).getMonth() + 1; // 1-indexed (1-12)
    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';
    return 'Q4';
}

async function generateForecast(user, data) {
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

    if (!checkForecastAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to run forecast for this cargo request');
    }

    // 1. Fetch current freight rate for the specific route (origin port -> destination port)
    const freightRate = await prisma.freightRate.findFirst({
        where: {
            originPortId: cargo.originPortId,
            destinationPortId: cargo.destinationPortId,
        },
        orderBy: { observedAt: 'desc' },
    });

    // IF NO FREIGHT RATE FOUND: Throw error as required by prompt
    if (!freightRate) {
        logger.warn('Insufficient freight rates for forecast execution', {
            originPortId: cargo.originPortId,
            destinationPortId: cargo.destinationPortId,
        });
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'Insufficient historical freight rate data to generate forecast'
        );
    }

    // 2. Fetch other features
    const fuelPrice = await prisma.fuelPrice.findFirst({
        orderBy: { observedAt: 'desc' },
    });

    const commodityPrice = await prisma.commodityPrice.findFirst({
        where: {
            commodity: {
                contains: cargo.cargoType,
            },
        },
        orderBy: { observedAt: 'desc' },
    });

    const portCongestion = await prisma.portCongestion.findFirst({
        where: { portId: cargo.destinationPortId },
        orderBy: { observedAt: 'desc' },
    });

    const economicIndicator = await prisma.economicIndicator.findFirst({
        orderBy: { observedAt: 'desc' },
    });

    // Construct payload adhering to ML contract features
    const payload = {
        requestId: `REQ-${cargo.id.slice(0, 8)}`,
        route: {
            origin: cargo.originPort.country || 'Unknown',
            destination: cargo.destinationPort.country || 'Unknown',
        },
        cargo: {
            type: cargo.cargoType,
            quantityMT: parseFloat(cargo.quantityMt),
        },
        features: {
            currentFreightRate: parseFloat(freightRate.rateValue),
            fuelPrice: fuelPrice ? parseFloat(fuelPrice.price) : 0,
            commodityPrice: commodityPrice ? parseFloat(commodityPrice.price) : 0,
            portCongestionIndex: portCongestion ? parseFloat(portCongestion.congestionIndex) : 0,
            demandIndex: economicIndicator ? parseFloat(economicIndicator.value) : 0.5,
            season: getSeason(cargo.requiredDate),
        },
        forecastHorizonDays: data.forecastHorizonDays || 14,
    };

    // Get response from ML mock
    const mlClient = getMlClient();
    const forecastOutput = await mlClient.forecastFreight(payload);

    // Persists the forecast
    const record = await prisma.forecastRecord.create({
        data: {
            cargoRequestId: cargo.id,
            modelVersion: forecastOutput.modelVersion,
            forecastJson: forecastOutput.forecast,
            confidence: forecastOutput.confidence,
        },
    });

    logger.info('Forecast generated and saved', {
        forecastRecordId: record.id,
        cargoRequestId: cargo.id,
        modelVersion: record.modelVersion,
    });

    return record;
}

async function getForecastByCargoId(cargoRequestId, user) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: cargoRequestId },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkForecastAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to view forecast data for this cargo request');
    }

    // Fetch the latest generated forecast record
    const latestForecast = await prisma.forecastRecord.findFirst({
        where: { cargoRequestId },
        orderBy: { createdAt: 'desc' },
    });

    if (!latestForecast) {
        throw new AppError(404, 'NOT_FOUND', 'No forecast record found for this cargo request');
    }

    return latestForecast;
}

module.exports = {
    generateForecast,
    getForecastByCargoId,
};
