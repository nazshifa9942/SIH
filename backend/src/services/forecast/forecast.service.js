const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { getMlClient } = require('../../integrations/ml/ml.client');
const { ROLES } = require('../../utils/roles');

function checkForecastAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;

    const isPrivileged =
        user.role === ROLES.ADMIN ||
        user.role === ROLES.LOGISTICS_MANAGER;

    return isOwner || isPrivileged;
}

function getSeason(date) {
    const month = new Date(date).getMonth() + 1;

    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';

    return 'Q4';
}

async function generateForecast(user, data) {
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

    if (!checkForecastAccess(cargo, user)) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to run forecast for this cargo request'
        );
    }

    // ---------------------------------------------------------
    // 1. Get latest freight rate for this route
    // ---------------------------------------------------------

    const vessel = await prisma.vessel.findFirst({
        where: {
            availabilityStatus: 'AVAILABLE',
        },
        orderBy: {
            capacityMt: 'asc',
        },
    });

    if (!vessel) {
        throw new AppError(
            400,
            'NO_AVAILABLE_VESSEL',
            'No available vessel found for freight forecasting'
        );
    }

    logger.info(
        'Using real available vessel for freight forecast',
        {
            cargoRequestId: cargo.id,
            vesselId: vessel.id,
            vesselName: vessel.name,
            vesselType: vessel.vesselType,
        }
    );

    // ---------------------------------------------------------
    // 2. Get supporting market data
    // ---------------------------------------------------------

    const fuelPrice = await prisma.fuelPrice.findFirst({
        orderBy: {
            observedAt: 'desc',
        },
    });

    const commodityPrice = await prisma.commodityPrice.findFirst({
        where: {
            commodity: {
                contains: cargo.cargoType,
            },
        },
        orderBy: {
            observedAt: 'desc',
        },
    });

    const portCongestion = await prisma.portCongestion.findFirst({
        where: {
            portId: cargo.destinationPortId,
        },
        orderBy: {
            observedAt: 'desc',
        },
    });

    const economicIndicator =
        await prisma.economicIndicator.findFirst({
            orderBy: {
                observedAt: 'desc',
            },
        });

    // ---------------------------------------------------------
    // 3. Prepare values for REAL XGBoost API
    // ---------------------------------------------------------

    const origin =
        cargo.originPort.code ||
        cargo.originPort.name ||
        cargo.originPort.country ||
        'Unknown';

    const destination =
        cargo.destinationPort.code ||
        cargo.destinationPort.name ||
        cargo.destinationPort.country ||
        'Unknown';

    const cargoType = cargo.cargoType;

    /*
     * The current FastAPI contract requires vessel_type.
     *
     * If the freightRate table contains vesselType, use it.
     * Otherwise use a safe default so the API request remains valid.
     */
    const vesselType = vessel.vesselType

    const forecastDate =
        new Date(cargo.requiredDate)
            .toISOString()
            .split('T')[0];

    const fuelPriceValue =
        fuelPrice &&
            fuelPrice.price !== null &&
            fuelPrice.price !== undefined
            ? parseFloat(fuelPrice.price)
            : 0;

    const waitHours =
        portCongestion &&
            portCongestion.waitHours !== null &&
            portCongestion.waitHours !== undefined
            ? parseFloat(portCongestion.waitHours)
            : 0;

    // ---------------------------------------------------------
    // 4. Payload expected by FastAPI /predict
    // ---------------------------------------------------------

    const payload = {
        origin,
        destination,
        vessel_type: vesselType,
        cargo_type: cargoType,
        date: forecastDate,
        fuel_price_vlsfo_usd: Number.isFinite(fuelPriceValue)
            ? fuelPriceValue
            : 0,
        dest_port_wait_hours: Number.isFinite(waitHours)
            ? waitHours
            : 0,
    };

    logger.info(
        'Sending freight forecast request to real ML service',
        {
            cargoRequestId: cargo.id,
            payload,
        }
    );

    // ---------------------------------------------------------
    // 5. Call REAL XGBoost ML service
    // ---------------------------------------------------------

    const mlClient = getMlClient();

    const mlResponse =
        await mlClient.predictFreight(payload);

    if (
        !mlResponse ||
        mlResponse.success !== true ||
        mlResponse.prediction === undefined
    ) {
        logger.error(
            'Invalid response received from ML service',
            {
                cargoRequestId: cargo.id,
                mlResponse,
            }
        );

        throw new AppError(
            502,
            'ML_SERVICE_ERROR',
            'Invalid response received from freight forecasting ML service'
        );
    }

    // ---------------------------------------------------------
    // 6. Convert ML prediction into application forecast format
    // ---------------------------------------------------------

    const prediction =
        parseFloat(mlResponse.prediction);

    if (!Number.isFinite(prediction)) {
        throw new AppError(
            502,
            'ML_SERVICE_ERROR',
            'ML service returned an invalid freight prediction'
        );
    }

    /*
     * The real model currently returns a point prediction.
     *
     * We store that prediction directly.
     * No fake confidence or fake forecast range is generated.
     */
    const forecast = {
        predictedFreightRate: prediction,
        unit: mlResponse.unit || 'USD/Tonne',
        route: {
            origin,
            destination,
        },
        cargoType,
        vesselType,
        forecastDate,
    };

    // ---------------------------------------------------------
    // 7. Persist forecast
    // ---------------------------------------------------------

    // const record = await prisma.forecastRecord.create({
    //     data: {
    //         cargoRequestId: cargo.id,

    //         modelVersion:
    //             mlResponse.model ||
    //             'real-xgboost',

    //         forecastJson: forecast,

    //         /*
    //          * Real ML API currently does not return confidence.
    //          * Keep this null rather than inventing a confidence value.
    //          */
    //         confidence: null,
    //     },
    // });

    const forecastData = [
        {
            date: mlResponse.date || cargo.requiredDate,
            predictedFreightRate: Number(mlResponse.prediction),
            unit: mlResponse.unit || 'USD/Tonne',
        },
    ];

    const record = await prisma.forecastRecord.create({
        data: {
            cargoRequestId: cargo.id,

            modelVersion:
                mlResponse.model ||
                'real-xgboost',

            forecastJson: forecastData,

            confidence: null,
        },
    });

    logger.info(
        'Real XGBoost freight forecast generated and saved',
        {
            forecastRecordId: record.id,
            cargoRequestId: cargo.id,
            modelVersion: record.modelVersion,
            predictedFreightRate: prediction,
        }
    );

    return record;
}

async function getForecastByCargoId(
    cargoRequestId,
    user
) {
    const cargo =
        await prisma.cargoRequest.findUnique({
            where: {
                id: cargoRequestId,
            },
        });

    if (!cargo) {
        throw new AppError(
            404,
            'NOT_FOUND',
            'Cargo request not found'
        );
    }

    if (!checkForecastAccess(cargo, user)) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to view forecast data for this cargo request'
        );
    }

    const latestForecast =
        await prisma.forecastRecord.findFirst({
            where: {
                cargoRequestId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

    if (!latestForecast) {
        throw new AppError(
            404,
            'NOT_FOUND',
            'No forecast record found for this cargo request'
        );
    }

    return latestForecast;
}

async function getForecastHistory(
    cargoRequestId,
    user
) {
    const cargo =
        await prisma.cargoRequest.findUnique({
            where: {
                id: cargoRequestId,
            },
        });

    if (!cargo) {
        throw new AppError(
            404,
            'NOT_FOUND',
            'Cargo request not found'
        );
    }

    if (!checkForecastAccess(cargo, user)) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to view forecast data for this cargo request'
        );
    }

    return prisma.forecastRecord.findMany({
        where: {
            cargoRequestId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

module.exports = {
    generateForecast,
    getForecastByCargoId,
    getForecastHistory,
};