const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');

/**
 * Phase 2.6 — Cost Calculation.
 *
 * Cost components:
 * - Freight
 * - Fuel
 * - Port
 * - Handling
 * - Delay / Demurrage
 * - Repositioning
 * - Other
 *
 * Documented calculation:
 *   freightCost = unitRate × quantityMt
 *   totalCost   = sum of all components
 *
 * Freight unit-rate precedence:
 *   1. Latest ForecastRecord
 *   2. Latest observed FreightRate on the cargo route
 *
 * The current real XGBoost model stores its forecast as:
 *
 * {
 *   predictedFreightRate: 11.0463,
 *   forecastDate: "2026-09-20"
 * }
 *
 * Legacy forecast records may also be stored as:
 *
 * [
 *   { predictedRate: 25.50 },
 *   { predictedRate: 26.10 }
 * ]
 *
 * Fuel, port, handling, delay, repositioning and other charges
 * remain zero because approved calculation formulas are not configured.
 */

const ZERO_PLACEHOLDER_LABEL = 'ZERO_PLACEHOLDER_UNDOCUMENTED';

/**
 * Check whether the logged-in user can access the cargo.
 */
function checkCostAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;

    const isPrivileged =
        user.role === ROLES.ADMIN ||
        user.role === ROLES.LOGISTICS_MANAGER;

    return isOwner || isPrivileged;
}

/**
 * Round monetary values to 2 decimal places.
 */
function roundToMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Resolve the freight unit rate for a cargo request.
 *
 * Priority:
 *
 * 1. Latest ForecastRecord
 *    - Real XGBoost object format:
 *      { predictedFreightRate: number }
 *
 *    - Legacy array format:
 *      [{ predictedRate: number }, ...]
 *
 * 2. Latest observed FreightRate for the route.
 */
async function resolveUnitFreightRate(cargo) {
    const latestForecast = await prisma.forecastRecord.findFirst({
        where: {
            cargoRequestId: cargo.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    /**
     * ------------------------------------------------------------
     * FORECAST SOURCE
     * ------------------------------------------------------------
     */
    if (latestForecast) {
        const forecastJson = latestForecast.forecastJson;

        /**
         * REAL XGBoost FORMAT
         *
         * Example:
         * {
         *   predictedFreightRate: 11.046307563781738,
         *   forecastDate: "2026-09-20"
         * }
         */
        if (
            forecastJson &&
            !Array.isArray(forecastJson) &&
            Number.isFinite(
                Number(forecastJson.predictedFreightRate)
            )
        ) {
            const unitRate =
                Number(forecastJson.predictedFreightRate);

            return {
                unitRate,
                source: 'FORECAST',
            };
        }

        /**
         * --------------------------------------------------------
         * LEGACY / ARRAY FORMAT
         * --------------------------------------------------------
         *
         * Supports both:
         *
         * { predictedRate: 25.50 }
         *
         * and
         *
         * { predictedFreightRate: 25.50 }
         */
        if (
            Array.isArray(forecastJson) &&
            forecastJson.length > 0
        ) {
            const validPredictions = forecastJson
                .map((prediction) => {
                    if (!prediction) {
                        return NaN;
                    }

                    const rate =
                        prediction.predictedRate ??
                        prediction.predictedFreightRate;

                    return Number(rate);
                })
                .filter((rate) => Number.isFinite(rate));

            if (validPredictions.length > 0) {
                const averageForecasted =
                    validPredictions.reduce(
                        (sum, rate) => sum + rate,
                        0
                    ) / validPredictions.length;

                return {
                    unitRate: averageForecasted,
                    source: 'FORECAST',
                };
            }
        }

        /**
         * A forecast record exists, but its JSON does not contain
         * a usable freight rate.
         *
         * Do not silently use a fake value.
         */
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'Forecast record has empty or invalid forecast data'
        );
    }

    /**
     * ------------------------------------------------------------
     * MARKET FALLBACK
     * ------------------------------------------------------------
     *
     * Only used when no ForecastRecord exists.
     */
    const latestFreightRate =
        await prisma.freightRate.findFirst({
            where: {
                originPortId: cargo.originPortId,
                destinationPortId: cargo.destinationPortId,
            },
            orderBy: {
                observedAt: 'desc',
            },
        });

    if (!latestFreightRate) {
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'No forecast record found for this cargo request and no observed freight rate available for the route'
        );
    }

    const marketUnitRate =
        Number(latestFreightRate.rateValue);

    if (!Number.isFinite(marketUnitRate)) {
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'Latest observed freight rate is invalid'
        );
    }

    return {
        unitRate: marketUnitRate,
        source: 'MARKET_OBSERVATION',
    };
}

/**
 * Compute and persist the cost estimate.
 */
async function computeCostEstimate(user, data) {
    /**
     * ------------------------------------------------------------
     * LOAD CARGO
     * ------------------------------------------------------------
     */
    const cargo = await prisma.cargoRequest.findUnique({
        where: {
            id: data.cargoRequestId,
        },
    });

    if (!cargo) {
        throw new AppError(
            404,
            'NOT_FOUND',
            'Cargo request not found'
        );
    }

    /**
     * ------------------------------------------------------------
     * ACCESS CHECK
     * ------------------------------------------------------------
     */
    if (!checkCostAccess(cargo, user)) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to estimate cost for this cargo request'
        );
    }

    /**
     * ------------------------------------------------------------
     * OPTIONAL VOYAGE PLAN
     * ------------------------------------------------------------
     */
    let voyagePlanId = null;

    if (data.voyagePlanId) {
        const voyagePlan =
            await prisma.voyagePlan.findUnique({
                where: {
                    id: data.voyagePlanId,
                },
            });

        if (!voyagePlan) {
            throw new AppError(
                404,
                'NOT_FOUND',
                'Voyage plan not found'
            );
        }

        if (voyagePlan.cargoRequestId !== cargo.id) {
            throw new AppError(
                400,
                'VALIDATION_ERROR',
                'Voyage plan does not belong to this cargo request'
            );
        }

        voyagePlanId = voyagePlan.id;
    }

    /**
     * ------------------------------------------------------------
     * RESOLVE FREIGHT RATE
     * ------------------------------------------------------------
     */
    const { unitRate, source } =
        await resolveUnitFreightRate(cargo);

    /**
     * ------------------------------------------------------------
     * QUANTITY
     * ------------------------------------------------------------
     */
    const quantityMt = Number(cargo.quantityMt);

    if (!Number.isFinite(quantityMt) || quantityMt <= 0) {
        throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Cargo quantity must be a positive number'
        );
    }

    /**
     * ------------------------------------------------------------
     * FREIGHT COST
     * ------------------------------------------------------------
     *
     * REAL calculation:
     *
     * freightCost = forecasted freight rate × cargo quantity
     */
    const freightCost = roundToMoney(
        unitRate * quantityMt
    );

    /**
     * ------------------------------------------------------------
     * OTHER COST COMPONENTS
     * ------------------------------------------------------------
     *
     * These remain zero because there are currently no approved
     * formulas / coefficients for them.
     *
     * No artificial assumptions are introduced.
     */
    const fuelCost = 0;
    const portCost = 0;
    const handlingCost = 0;
    const delayCost = 0;
    const repositioningCost = 0;
    const otherCost = 0;

    /**
     * ------------------------------------------------------------
     * TOTAL COST
     * ------------------------------------------------------------
     */
    const totalCost = roundToMoney(
        freightCost +
        fuelCost +
        portCost +
        handlingCost +
        delayCost +
        repositioningCost +
        otherCost
    );

    /**
     * ------------------------------------------------------------
     * SAVE COST BREAKDOWN
     * ------------------------------------------------------------
     */
    const breakdown =
        await prisma.costBreakdown.create({
            data: {
                cargoRequestId: cargo.id,
                voyagePlanId,

                freightCost,
                fuelCost,
                portCost,
                handlingCost,
                delayCost,
                repositioningCost,
                otherCost,

                totalCost,
            },
        });

    /**
     * ------------------------------------------------------------
     * LOG RESULT
     * ------------------------------------------------------------
     */
    logger.info(
        'Cost estimate generated and saved',
        {
            costBreakdownId: breakdown.id,
            cargoRequestId: cargo.id,
            freightSource: source,
            freightUnitRate: unitRate,
            quantityMt,
            freightCost,
            totalCost,
        }
    );

    /**
     * ------------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------------
     *
     * meta is response-only information.
     * It is not persisted because the Prisma schema has no
     * corresponding columns.
     */
    return {
        ...breakdown,

        meta: {
            freightUnitRate: unitRate,
            freightSource: source,

            componentStatus: {
                freight: 'COMPUTED',

                fuel: ZERO_PLACEHOLDER_LABEL,
                port: ZERO_PLACEHOLDER_LABEL,
                handling: ZERO_PLACEHOLDER_LABEL,
                delay: ZERO_PLACEHOLDER_LABEL,
                repositioning: ZERO_PLACEHOLDER_LABEL,
                other: ZERO_PLACEHOLDER_LABEL,
            },
        },
    };
}

/**
 * Get all saved cost breakdowns for a cargo request.
 */
async function getCostBreakdownsByCargoId(
    cargoRequestId,
    user
) {
    /**
     * ------------------------------------------------------------
     * LOAD CARGO
     * ------------------------------------------------------------
     */
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

    /**
     * ------------------------------------------------------------
     * ACCESS CHECK
     * ------------------------------------------------------------
     */
    if (!checkCostAccess(cargo, user)) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to view cost breakdowns for this cargo request'
        );
    }

    /**
     * ------------------------------------------------------------
     * FETCH COST HISTORY
     * ------------------------------------------------------------
     */
    const breakdowns =
        await prisma.costBreakdown.findMany({
            where: {
                cargoRequestId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

    return breakdowns;
}

module.exports = {
    resolveUnitFreightRate,
    computeCostEstimate,
    getCostBreakdownsByCargoId,
};