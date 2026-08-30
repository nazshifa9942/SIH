const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');

/**
 * Phase 2.6 — Cost Calculation.
 *
 * Formula classification (see approved implementation plan):
 * - Component list (freight, fuel, port, handling, delay/demurrage,
 *   repositioning, other): DOCUMENTED (BUSINESS_RULES.md, PROJECT_SPEC.md Feature 6).
 * - totalCost = sum of components: DOCUMENTED (implied additive composition).
 * - freightCost = unitRate x quantityMt: INFERRED (consistent with Phase 2.3
 *   placeholder behavior and freight_rates.rate_unit = 'MT').
 * - Unit-rate precedence: latest ForecastRecord average first, fallback to
 *   latest observed route FreightRate: INFERRED.
 * - fuel / port / handling / delay / repositioning / other: UNSPECIFIED.
 *   No formula or coefficient exists in any source-of-truth document.
 *   They are persisted as zero placeholders and never invented here.
 */

const ZERO_PLACEHOLDER_LABEL = 'ZERO_PLACEHOLDER_UNDOCUMENTED';

function checkCostAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
    return isOwner || isPrivileged;
}

function roundToMoney(value) {
    // Single rounding step at persist time; money columns are Decimal(14,2).
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Resolves the unit freight rate for a cargo request.
 *
 * Precedence (INFERRED, mirrors Phase 2.3):
 *   1. Latest ForecastRecord -> average of forecastJson[].predictedRate ("FORECAST").
 *   2. Fallback: latest observed FreightRate on the cargo route ("MARKET_OBSERVATION").
 *
 * Throws INSUFFICIENT_DATA when neither source can produce a usable rate.
 */
async function resolveUnitFreightRate(cargo) {
    const latestForecast = await prisma.forecastRecord.findFirst({
        where: { cargoRequestId: cargo.id },
        orderBy: { createdAt: 'desc' },
    });

    if (latestForecast) {
        const predictions = latestForecast.forecastJson;
        if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
            // Mirror Phase 2.3 behavior: a present-but-empty forecast is a data
            // error, not a reason to silently fall back to another source.
            throw new AppError(
                400,
                'INSUFFICIENT_DATA',
                'Forecast record has empty forecast data'
            );
        }

        const sum = predictions.reduce(
            (acc, p) => acc + (parseFloat(p.predictedRate) || 0),
            0
        );
        const averageForecasted = sum / predictions.length;

        return {
            unitRate: averageForecasted,
            source: 'FORECAST',
        };
    }

    const latestFreightRate = await prisma.freightRate.findFirst({
        where: {
            originPortId: cargo.originPortId,
            destinationPortId: cargo.destinationPortId,
        },
        orderBy: { observedAt: 'desc' },
    });

    if (!latestFreightRate) {
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'No forecast record found for this cargo request and no observed freight rate available for the route'
        );
    }

    return {
        unitRate: parseFloat(latestFreightRate.rateValue),
        source: 'MARKET_OBSERVATION',
    };
}

async function computeCostEstimate(user, data) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: data.cargoRequestId },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkCostAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to estimate cost for this cargo request');
    }

    let voyagePlanId = null;
    if (data.voyagePlanId) {
        const voyagePlan = await prisma.voyagePlan.findUnique({
            where: { id: data.voyagePlanId },
        });

        if (!voyagePlan) {
            throw new AppError(404, 'NOT_FOUND', 'Voyage plan not found');
        }

        if (voyagePlan.cargoRequestId !== cargo.id) {
            throw new AppError(400, 'VALIDATION_ERROR', 'Voyage plan does not belong to this cargo request');
        }

        voyagePlanId = voyagePlan.id;
    }

    const { unitRate, source } = await resolveUnitFreightRate(cargo);

    const quantityMt = parseFloat(cargo.quantityMt);
    const freightCost = roundToMoney(unitRate * quantityMt);

    // UNSPECIFIED components (fuel, port, handling, delay/demurrage,
    // repositioning, other): documented formulas do not exist, so they are
    // persisted as zero placeholders. No coefficients are invented here.
    const fuelCost = 0;
    const portCost = 0;
    const handlingCost = 0;
    const delayCost = 0;
    const repositioningCost = 0;
    const otherCost = 0;

    // DOCUMENTED (implied): total is the additive composition of components.
    const totalCost = roundToMoney(
        freightCost +
        fuelCost +
        portCost +
        handlingCost +
        delayCost +
        repositioningCost +
        otherCost
    );

    const breakdown = await prisma.costBreakdown.create({
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

    logger.info('Cost estimate generated and saved', {
        costBreakdownId: breakdown.id,
        cargoRequestId: cargo.id,
        freightSource: source,
    });

    // Response-only derivation metadata (not persisted; the schema has no
    // columns for it). Keeps the response transparent about computed vs
    // placeholder components per BUSINESS_RULES.md data-integrity rule.
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

async function getCostBreakdownsByCargoId(cargoRequestId, user) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: cargoRequestId },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkCostAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to view cost breakdowns for this cargo request');
    }

    const breakdowns = await prisma.costBreakdown.findMany({
        where: { cargoRequestId },
        orderBy: { createdAt: 'desc' },
    });

    return breakdowns;
}

module.exports = {
    resolveUnitFreightRate,
    computeCostEstimate,
    getCostBreakdownsByCargoId,
};