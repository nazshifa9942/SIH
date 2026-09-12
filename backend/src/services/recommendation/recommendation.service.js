const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');

function checkRecommendationAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;

    const isPrivileged =
        user.role === ROLES.ADMIN ||
        user.role === ROLES.LOGISTICS_MANAGER;

    return isOwner || isPrivileged;
}

async function generateRecommendation(user, data) {
    // ---------------------------------------------------------
    // 1. Get cargo request
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 2. Authorization
    // ---------------------------------------------------------
    if (!checkRecommendationAccess(cargo, user)) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to generate recommendation for this cargo request'
        );
    }

    // ---------------------------------------------------------
    // 3. Get latest REAL forecast
    //
    // Forecast is the primary input for recommendation.
    // We do NOT automatically generate another forecast here.
    // ---------------------------------------------------------
    const latestForecast = await prisma.forecastRecord.findFirst({
        where: {
            cargoRequestId: cargo.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (!latestForecast) {
        logger.warn(
            'No forecast record found for recommendation execution',
            {
                cargoRequestId: cargo.id,
            }
        );

        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'No forecast record found for this cargo request'
        );
    }

    // ---------------------------------------------------------
    // 4. Read forecast JSON
    //
    // Supports:
    // A. Real XGBoost single prediction:
    //    { predictedFreightRate: 11.05 }
    //
    // B. Legacy/multi-point format:
    //    [{ predictedRate: 11.05 }, ...]
    // ---------------------------------------------------------
    const forecastJson = latestForecast.forecastJson;

    let averageForecasted = null;

    // Real XGBoost forecast format
    if (
        forecastJson &&
        !Array.isArray(forecastJson) &&
        Number.isFinite(
            Number(forecastJson.predictedFreightRate)
        )
    ) {
        averageForecasted =
            Number(forecastJson.predictedFreightRate);
    }

    // Multi-point / legacy forecast format
    else if (
        Array.isArray(forecastJson) &&
        forecastJson.length > 0
    ) {
        const validPredictions = forecastJson
            .map((point) => {
                if (!point) {
                    return NaN;
                }

                const rate =
                    point.predictedRate ??
                    point.predictedFreightRate;

                return Number(rate);
            })
            .filter((rate) => Number.isFinite(rate));

        if (validPredictions.length === 0) {
            throw new AppError(
                400,
                'INSUFFICIENT_DATA',
                'Forecast record has empty forecast data'
            );
        }

        averageForecasted =
            validPredictions.reduce(
                (sum, rate) => sum + rate,
                0
            ) / validPredictions.length;
    }

    else {
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'Forecast record has empty or invalid forecast data'
        );
    }

    if (
        !Number.isFinite(averageForecasted) ||
        averageForecasted <= 0
    ) {
        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'Forecast record does not contain a valid positive freight rate'
        );
    }

    // ---------------------------------------------------------
    // 5. Get latest historical market observation
    //
    // IMPORTANT:
    // This is OPTIONAL.
    //
    // Newcastle -> Paradip currently has no exact historical
    // FreightRate record, so recommendation must still work
    // using the real XGBoost forecast.
    // ---------------------------------------------------------
    const currentRate = await prisma.freightRate.findFirst({
        where: {
            originPortId: cargo.originPortId,
            destinationPortId: cargo.destinationPortId,
        },
        orderBy: {
            observedAt: 'desc',
        },
    });

    let currentFreightValue = null;

    if (
        currentRate &&
        currentRate.rateValue !== null &&
        currentRate.rateValue !== undefined
    ) {
        const parsedCurrentRate =
            parseFloat(currentRate.rateValue);

        if (
            Number.isFinite(parsedCurrentRate) &&
            parsedCurrentRate > 0
        ) {
            currentFreightValue = parsedCurrentRate;
        }
    }

    // ---------------------------------------------------------
    // 6. Recommendation decision
    //
    // If a current market observation exists:
    //   compare forecast/current rate.
    //
    // If it does not exist:
    //   do NOT invent a current rate.
    //   Use EVALUATE because trend comparison cannot be
    //   calculated honestly.
    // ---------------------------------------------------------
    let recommendedAction = 'EVALUATE';
    let explanation = '';
    let windowStart = null;
    let windowEnd = null;

    if (
        currentFreightValue !== null
    ) {
        const trendRatio =
            averageForecasted / currentFreightValue;

        if (trendRatio < 0.98) {
            recommendedAction = 'WAIT';

            explanation =
                'Forecasted freight rates show a downward trend. Recommend waiting to charter.';
        }

        else if (trendRatio > 1.02) {
            recommendedAction = 'CHARTER_NOW';

            explanation =
                'Forecasted freight rates show an upward trend. Recommend chartering now to lock in rates.';

            windowStart = new Date();

            windowEnd = new Date(windowStart);

            windowEnd.setDate(
                windowStart.getDate() + 3
            );
        }

        else {
            recommendedAction = 'EVALUATE';

            explanation =
                'Forecasted freight rates are stable. Evaluate alternate chartering options.';
        }
    }

    else {
        recommendedAction = 'EVALUATE';

        explanation =
            'A real freight forecast is available, but no historical market rate exists for this exact route. Evaluate chartering options using the forecast and optimized vessel plan.';
    }

    // ---------------------------------------------------------
    // 7. Get REAL persisted optimization result
    //
    // IMPORTANT:
    // Do NOT call planVessels().
    //
    // The recommendation uses the VoyagePlan rows already
    // generated by the real OR-Tools optimization service.
    // ---------------------------------------------------------
    const [costHistory, voyagePlans] =
        await Promise.all([
            prisma.costBreakdown.findMany({
                where: {
                    cargoRequestId: cargo.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),

            prisma.voyagePlan.findMany({
                where: {
                    cargoRequestId: cargo.id,
                },
                include: {
                    vessel: true,
                },
                orderBy: {
                    tripNumber: 'asc',
                },
            }),
        ]);

    // ---------------------------------------------------------
    // 8. Optimization result is required
    //
    // Recommendation should not silently fall back to a mock
    // vessel plan.
    // ---------------------------------------------------------
    if (voyagePlans.length === 0) {
        logger.warn(
            'No optimized vessel plan found for recommendation',
            {
                cargoRequestId: cargo.id,
            }
        );

        throw new AppError(
            400,
            'INSUFFICIENT_DATA',
            'No optimized vessel plan found for this cargo request'
        );
    }

    // ---------------------------------------------------------
    // 9. Latest cost result
    // ---------------------------------------------------------
    const latestCost =
        costHistory.length > 0
            ? costHistory[0]
            : null;

    // ---------------------------------------------------------
    // 10. Build recommendation vessel plan
    //
    // This comes only from persisted VoyagePlan rows.
    // These rows were generated by the real OR-Tools
    // optimization pipeline.
    // ---------------------------------------------------------
    const persistedPlan = {
        feasible: voyagePlans.every(
            (plan) =>
                plan.feasibilityStatus === 'FEASIBLE'
        ),

        recommendedPlan: voyagePlans.map((plan) => ({
            vesselId: plan.vesselId,
            vesselName: plan.vessel
                ? plan.vessel.name
                : null,
            vesselType: plan.vessel
                ? plan.vessel.vesselType
                : null,
            tripNumber: plan.tripNumber,
            quantityMT: Number(
                plan.plannedQuantityMt
            ),
            feasibilityStatus:
                plan.feasibilityStatus,
        })),

        numberOfTrips: voyagePlans.length,

        totalEstimatedCost: latestCost
            ? Number(latestCost.totalCost)
            : null,

        voyagePlans,
    };

    // ---------------------------------------------------------
    // 11. Estimated total cost
    //
    // Prefer the latest persisted CostBreakdown.
    // No invented cost calculation here.
    // ---------------------------------------------------------
    const estimatedTotalCost =
        latestCost &&
        latestCost.totalCost !== null &&
        latestCost.totalCost !== undefined
            ? Number(latestCost.totalCost)
            : persistedPlan.totalEstimatedCost;

    // ---------------------------------------------------------
    // 12. Contract strategy
    // ---------------------------------------------------------
    const contractStrategy =
        cargo.contractDuration || 'SPOT';

    // ---------------------------------------------------------
    // 13. Risk level
    //
    // Keep existing behavior.
    // No fake confidence is generated.
    // ---------------------------------------------------------
    const forecastConfidence =
        latestForecast.confidence !== null &&
        latestForecast.confidence !== undefined
            ? parseFloat(latestForecast.confidence)
            : null;

    const riskLevel =
        Number.isFinite(forecastConfidence) &&
        forecastConfidence < 0.7
            ? 'MEDIUM'
            : 'LOW';

    // ---------------------------------------------------------
    // 14. Expected savings
    //
    // Only calculate when a real historical/current market
    // rate exists.
    //
    // If there is no current market observation, return null.
    // ---------------------------------------------------------
    const quantityMt =
        parseFloat(cargo.quantityMt);

    const expectedSavings =
        currentFreightValue !== null &&
        Number.isFinite(quantityMt)
            ? Math.max(
                0,
                (
                    currentFreightValue -
                    averageForecasted
                ) * quantityMt
            )
            : null;

    // ---------------------------------------------------------
    // 15. Persist Recommendation
    // ---------------------------------------------------------
    const recommendation =
        await prisma.recommendation.create({
            data: {
                cargoRequestId: cargo.id,

                recommendedAction,

                windowStart:
                    windowStart
                        ? new Date(windowStart)
                        : null,

                windowEnd:
                    windowEnd
                        ? new Date(windowEnd)
                        : null,

                expectedFreight:
                    averageForecasted,

                estimatedTotalCost,

                riskLevel,

                confidence:
                    latestForecast.confidence,

                contractStrategy,

                vesselPlanJson:
                    JSON.parse(
                        JSON.stringify(
                            persistedPlan
                        )
                    ),

                explanation,
            },
        });

    // ---------------------------------------------------------
    // 16. Persist Cost Breakdown
    //
    // Freight cost is computed from the REAL forecast.
    // Other components remain zero because no approved
    // calculation formulas are available.
    // ---------------------------------------------------------
    const freightCost =
        Number.isFinite(quantityMt)
            ? averageForecasted * quantityMt
            : 0;

    await prisma.costBreakdown.create({
        data: {
            cargoRequestId: cargo.id,

            freightCost,

            fuelCost: 0,

            portCost: 0,

            handlingCost: 0,

            delayCost: 0,

            repositioningCost: 0,

            otherCost: 0,

            totalCost:
                estimatedTotalCost !== null
                    ? estimatedTotalCost
                    : freightCost,
        },
    });

    // ---------------------------------------------------------
    // 17. Logging
    // ---------------------------------------------------------
    logger.info(
        'Recommendation generated and saved',
        {
            recommendationId:
                recommendation.id,

            cargoRequestId:
                cargo.id,

            recommendedAction,

            forecastFreightRate:
                averageForecasted,

            currentFreightRate:
                currentFreightValue,

            expectedSavings,

            optimizedTripCount:
                voyagePlans.length,

            estimatedTotalCost,
        }
    );

    // ---------------------------------------------------------
    // 18. Response
    // ---------------------------------------------------------
    return {
        ...recommendation,

        currentFreightRate:
            currentFreightValue,

        expectedSavings,
    };
}


// ============================================================
// GET RECOMMENDATION BY ID
// ============================================================

async function getRecommendationById(id, user) {
    const recommendation =
        await prisma.recommendation.findUnique({
            where: {
                id,
            },
        });

    if (!recommendation) {
        throw new AppError(
            404,
            'NOT_FOUND',
            'Recommendation not found'
        );
    }

    const cargo =
        await prisma.cargoRequest.findUnique({
            where: {
                id: recommendation.cargoRequestId,
            },
        });

    if (
        !cargo ||
        !checkRecommendationAccess(
            cargo,
            user
        )
    ) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to view this recommendation'
        );
    }

    return recommendation;
}


// ============================================================
// GET ALL RECOMMENDATIONS FOR CARGO
// ============================================================

async function getRecommendationsByCargoId(
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

    if (
        !checkRecommendationAccess(
            cargo,
            user
        )
    ) {
        throw new AppError(
            403,
            'FORBIDDEN',
            'Insufficient permissions to view recommendations for this cargo request'
        );
    }

    const recommendations =
        await prisma.recommendation.findMany({
            where: {
                cargoRequestId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

    return recommendations;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    generateRecommendation,
    getRecommendationById,
    getRecommendationsByCargoId,
};