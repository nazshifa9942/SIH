const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');
const { resolveUnitFreightRate } = require('../cost/cost.service');

/**
 * Phase 2.9 — Contract / Procurement Strategy.
 *
 * Formula classification (see approved implementation plan):
 * - Four strategies (spot, short-term, multiple-voyage, longer-term):
 *   DOCUMENTED (BUSINESS_RULES.md Contract section, PROJECT_SPEC.md Feature 9).
 *   Uppercase values are the INFERRED normalized representation.
 * - "Compare ... only when sufficient data exists": DOCUMENTED rule; the
 *   concrete sufficiency threshold is INFERRED and enforced by reusing the
 *   existing cost-service gate (resolveUnitFreightRate) — no logic duplicated.
 * - indicativeFreightOutlay = unitRate x quantityMt: INFERRED arithmetic on
 *   documented fields only. No strategy-specific prices, discounts,
 *   percentages or cross-strategy price comparisons are generated.
 * - contractDuration: DOCUMENTED free-text field; echoed verbatim. No
 *   duration-to-strategy mapping exists in any document — none created.
 * - Strategy selection algorithm: UNSPECIFIED. selection is returned as
 *   NOT_DETERMINED with an explicit reason; no winner is ever chosen here.
 * - Persistence: none — DATABASE_SCHEMA.md defines no contract-comparison
 *   table; strategy persistence already lives in Recommendation.contract_strategy
 *   (written by Phase 2.3, read-only here).
 */

const POLICY = 'PHASE_2_9_CONTRACT_COMPARE_MOCK';
const DISCLAIMER =
    'Compare spot, short-term, multiple-voyage and longer-term options only when sufficient data exists.';
const SELECTION_REASON = 'NO_STRATEGY_SELECTION_ALGORITHM_DOCUMENTED';

// The four DOCUMENTED strategies (BUSINESS_RULES.md), uppercase normalization.
const STRATEGIES = ['SPOT', 'SHORT_TERM', 'MULTIPLE_VOYAGE', 'LONGER_TERM'];

function checkContractAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
    return isOwner || isPrivileged;
}

function roundToMoney(value) {
    // Single rounding step at persist/response time (money convention, Phase 2.6).
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildStrategyRows() {
    return STRATEGIES.map((strategy) => ({
        strategy,
        status: 'EVALUABLE',
        reason: null,
    }));
}

async function buildReferenceMetrics(cargo, unitRate, latestForecast) {
    const [voyagePlans, costBreakdowns] = await Promise.all([
        prisma.voyagePlan.findMany({
            where: { cargoRequestId: cargo.id },
        }),
        prisma.costBreakdown.findMany({
            where: { cargoRequestId: cargo.id },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    const voyagePlanCount = voyagePlans.length;
    const latestCostBreakdown = costBreakdowns.length > 0 ? costBreakdowns[0] : null;

    const forecastConfidence =
        latestForecast && latestForecast.confidence !== null && latestForecast.confidence !== undefined
            ? parseFloat(latestForecast.confidence)
            : null;

    const quantityMt = parseFloat(cargo.quantityMt);

    return {
        // INFERRED arithmetic only: shared across all strategies because no
        // strategy-specific pricing formula is documented anywhere.
        indicativeFreightOutlay: roundToMoney(unitRate * quantityMt),
        forecastConfidence,
        plannedTripCount: voyagePlanCount,
        latestEstimatedTotalCost:
            latestCostBreakdown ? parseFloat(latestCostBreakdown.totalCost) : null,
    };
}

function buildSelection() {
    // UNSPECIFIED: no strategy-selection algorithm exists in any document.
    // No winner is chosen; the absence is made explicit instead.
    return {
        status: 'NOT_DETERMINED',
        reason: SELECTION_REASON,
    };
}

/**
 * Shared stateless comparison pipeline for POST /api/contracts/compare and
 * GET /api/contracts/:cargoRequestId. Nothing is persisted.
 */
async function compareContracts(user, data) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: data.cargoRequestId },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkContractAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to compare contracts for this cargo request');
    }

    // Reused gate + rate resolution from the cost module (no duplication).
    // Throws 400 INSUFFICIENT_DATA when neither forecast nor route rate exists.
    const { unitRate, source } = await resolveUnitFreightRate(cargo);

    const latestForecast = await prisma.forecastRecord.findFirst({
        where: { cargoRequestId: cargo.id },
        orderBy: { createdAt: 'desc' },
    });

    const referenceMetrics = await buildReferenceMetrics(cargo, unitRate, latestForecast);

    logger.info('Contract strategy comparison completed', {
        cargoRequestId: cargo.id,
        freightSource: source,
    });

    return {
        cargoRequestId: cargo.id,
        comparedAt: new Date().toISOString(),
        cargo: {
            contractDuration: cargo.contractDuration || null,
            quantityMt: parseFloat(cargo.quantityMt),
            requiredDate: cargo.requiredDate,
        },
        sufficiency: {
            status: 'SUFFICIENT_DATA',
            freightSource: source,
            freightUnitRate: unitRate,
        },
        strategies: buildStrategyRows(),
        referenceMetrics,
        selection: buildSelection(),
        basis: {
            policy: POLICY,
        },
        disclaimer: DISCLAIMER,
    };
}

/**
 * GET /api/contracts/:cargoRequestId — same stateless comparison plus a
 * READ-ONLY echo of the strategy persisted by Phase 2.3 on the latest
 * Recommendation. No Recommendation records are created or updated.
 */
async function getContractComparison(user, data) {
    const comparison = await compareContracts(user, data);

    const recommendations = await prisma.recommendation.findMany({
        where: { cargoRequestId: comparison.cargoRequestId },
        orderBy: { createdAt: 'desc' },
    });

    const latestRecommendation = recommendations.length > 0 ? recommendations[0] : null;

    return {
        ...comparison,
        persistedRecommendationStrategy: latestRecommendation
            ? {
                  contractStrategy: latestRecommendation.contractStrategy || null,
                  recommendationId: latestRecommendation.id,
                  createdAt: latestRecommendation.createdAt,
              }
            : null,
    };
}

module.exports = {
    compareContracts,
    getContractComparison,
    buildStrategyRows,
};