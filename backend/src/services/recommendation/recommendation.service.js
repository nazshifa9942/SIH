const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');
const { planVessels } = require('../../integrations/optimization/optimization.client');

function checkRecommendationAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
    return isOwner || isPrivileged;
}

async function generateRecommendation(user, data) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: data.cargoRequestId },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkRecommendationAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to generate recommendation for this cargo request');
    }

    // Rule 7.3: Missing Forecast Handling - Return INSUFFICIENT_DATA and do not auto-generate
    const latestForecast = await prisma.forecastRecord.findFirst({
        where: { cargoRequestId: cargo.id },
        orderBy: { createdAt: 'desc' },
    });

    if (!latestForecast) {
        logger.warn('No forecast record found for recommendation execution', { cargoRequestId: cargo.id });
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'No forecast record found for this cargo request'
        );
    }

    // Retrieve current freight rate for trend comparison
    const currentRate = await prisma.freightRate.findFirst({
        where: {
            originPortId: cargo.originPortId,
            destinationPortId: cargo.destinationPortId,
        },
        orderBy: { observedAt: 'desc' },
    });

    if (!currentRate) {
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'Insufficient historical freight rate data to calculate recommendations'
        );
    }

    // Rule 8.2: Expected Freight Rate (Average Forecasted rate)
    const predictions = latestForecast.forecastJson;
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'Forecast record has empty forecast data'
        );
    }

    const sum = predictions.reduce((acc, p) => acc + (parseFloat(p.predictedRate) || 0), 0);
    const averageForecasted = sum / predictions.length;

    // Rule 8.1: Decision Strategy Logic (Isolated)
    let recommendedAction = 'EVALUATE';
    let explanation = '';
    let windowStart = null;
    let windowEnd = null;

    const currentFreightValue = parseFloat(currentRate.rateValue);
    const trendRatio = averageForecasted / currentFreightValue;

    if (trendRatio < 0.98) {
        recommendedAction = 'WAIT';
        explanation = 'Forecasted freight rates show a downward trend. Recommend waiting to charter.';
    } else if (trendRatio > 1.02) {
        recommendedAction = 'CHARTER_NOW';
        explanation = 'Forecasted freight rates show an upward trend. Recommend chartering now to lock in rates.';
        windowStart = new Date();
        windowEnd = new Date();
        windowEnd.setDate(windowStart.getDate() + 3);
    } else {
        recommendedAction = 'EVALUATE';
        explanation = 'Forecasted freight rates are stable. Evaluate alternate options.';
    }

    // Use the latest saved cost and voyage plan when available. The mock plan
    // remains the fallback for cargo that has not completed optimization yet.
    const optPlan = await planVessels(cargo);
    const [costHistory, voyagePlans] = await Promise.all([
        prisma.costBreakdown.findMany({
            where: { cargoRequestId: cargo.id },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.voyagePlan.findMany({
            where: { cargoRequestId: cargo.id },
            include: { vessel: true },
            orderBy: { tripNumber: 'asc' },
        }),
    ]);
    const latestCost = costHistory.find((cost) => cost.voyagePlanId) || null;

    const persistedPlan = voyagePlans.length > 0
        ? {
            feasible: voyagePlans.every((plan) => plan.feasibilityStatus === 'FEASIBLE'),
            recommendedPlan: voyagePlans.map((plan) => ({
                vesselId: plan.vesselId,
                vesselName: plan.vessel?.name,
                tripNumber: plan.tripNumber,
                quantityMT: Number(plan.plannedQuantityMt),
            })),
            numberOfTrips: voyagePlans.length,
            totalEstimatedCost: latestCost ? Number(latestCost.totalCost) : optPlan.totalEstimatedCost,
            voyagePlans,
        }
        : optPlan;

    const estimatedTotalCost = latestCost
        ? Number(latestCost.totalCost)
        : persistedPlan.totalEstimatedCost;
    const contractStrategy = cargo.contractDuration || 'SPOT';
    const riskLevel = latestForecast.confidence && parseFloat(latestForecast.confidence) < 0.7 ? 'MEDIUM' : 'LOW';

    // Persist Recommendation
    const recommendation = await prisma.recommendation.create({
        data: {
            cargoRequestId: cargo.id,
            recommendedAction,
            windowStart: windowStart ? new Date(windowStart) : null,
            windowEnd: windowEnd ? new Date(windowEnd) : null,
            expectedFreight: averageForecasted,
            estimatedTotalCost,
            riskLevel,
            confidence: latestForecast.confidence,
            contractStrategy,
            vesselPlanJson: JSON.parse(JSON.stringify(persistedPlan)),
            explanation,
        },
    });

    // Rule 7.5: Cost Breakdown Persistence
    await prisma.costBreakdown.create({
        data: {
            cargoRequestId: cargo.id,
            freightCost: averageForecasted * parseFloat(cargo.quantityMt),
            fuelCost: 0,
            portCost: 0,
            handlingCost: 0,
            delayCost: 0,
            repositioningCost: 0,
            otherCost: 0,
            totalCost: estimatedTotalCost,
        },
    });

    logger.info('Recommendation generated and saved', {
        recommendationId: recommendation.id,
        cargoRequestId: cargo.id,
        recommendedAction,
    });

    return {
        ...recommendation,
        currentFreightRate: currentFreightValue,
        expectedSavings: Math.max(0, (currentFreightValue - averageForecasted) * parseFloat(cargo.quantityMt)),
    };
}

async function getRecommendationById(id, user) {
    const recommendation = await prisma.recommendation.findUnique({
        where: { id },
    });

    if (!recommendation) {
        throw new AppError(404, 'NOT_FOUND', 'Recommendation not found');
    }

    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: recommendation.cargoRequestId },
    });

    if (!cargo || !checkRecommendationAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to view this recommendation');
    }

    return recommendation;
}

async function getRecommendationsByCargoId(cargoRequestId, user) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: cargoRequestId },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkRecommendationAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to view recommendations for this cargo request');
    }

    const recommendations = await prisma.recommendation.findMany({
        where: { cargoRequestId },
        orderBy: { createdAt: 'desc' },
    });

    return recommendations;
}

module.exports = {
    generateRecommendation,
    getRecommendationById,
    getRecommendationsByCargoId,
};
