const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');

/**
 * Phase 2.7 — Risk Analysis & Early Warning.
 *
 * Formula classification (see approved implementation plan):
 * - Factor list (congestion, weather, freight volatility, vessel availability,
 *   approved event signals): DOCUMENTED (PROJECT_SPEC.md Feature 7).
 * - "Risk is an estimate, not a guarantee": DOCUMENTED (BUSINESS_RULES.md) —
 *   reproduced verbatim as the response disclaimer.
 * - "High risk should trigger review/alert": DOCUMENTED rule; wired via
 *   reviewRequired = (overallLevel === 'HIGH'). HIGH is unreachable in
 *   Phase 2.7 (no documented thresholds), so this stays dormant by design.
 * - confidence < 0.7 => MEDIUM: INFERRED (verbatim precedent from Phase 2.3
 *   recommendation.service.js). This is the ONLY level escalation.
 * - Congestion / weather / volatility / availability -> level mappings and
 *   thresholds: UNSPECIFIED. Factors are reported observationally and never
 *   move overallLevel. No weights, thresholds, scores or ML are invented.
 * - Persistence: UNSPECIFIED (DATABASE_SCHEMA.md defines no risk table).
 *   Assessments are computed on demand and never persisted.
 */

const DISCLAIMER = 'Risk is an estimate, not a guarantee.';
const AGGREGATION_POLICY = 'PHASE_2_7_CONSERVATIVE_MOCK';
// INFERRED: reused verbatim from the Phase 2.3 recommendation precedent.
const CONFIDENCE_ESCALATION_THRESHOLD = 0.7;

function checkRiskAccess(cargo, user) {
    const isOwner = cargo.userId === user.id;
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.LOGISTICS_MANAGER;
    return isOwner || isPrivileged;
}

function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function round4(value) {
    if (value === null) {
        return null;
    }
    return Math.round(value * 10000) / 10000;
}

/**
 * Factor 1 (DOCUMENTED): changing congestion.
 * Reports the latest PortCongestion per port; deltas between the two most
 * recent observations per port (INFERRED minimal reading of "changing").
 * UNSPECIFIED: any mapping from congestion values to risk level — not applied.
 */
async function evaluateCongestion(originPortId, destinationPortId) {
    const [originObservations, destinationObservations] = await Promise.all([
        prisma.portCongestion.findMany({
            where: { portId: originPortId },
            orderBy: { observedAt: 'desc' },
        }),
        prisma.portCongestion.findMany({
            where: { portId: destinationPortId },
            orderBy: { observedAt: 'desc' },
        }),
    ]);

    const summarize = (observations) => {
        if (observations.length === 0) {
            return null;
        }
        const latest = observations[0];
        return {
            congestionIndex: toNumber(latest.congestionIndex),
            avgWaitHours: toNumber(latest.avgWaitHours),
            vesselsWaiting: latest.vesselsWaiting,
            observedAt: latest.observedAt,
        };
    };

    const delta = (observations) => {
        if (observations.length < 2) {
            return null;
        }
        const latest = toNumber(observations[0].congestionIndex);
        const previous = toNumber(observations[1].congestionIndex);
        if (latest === null || previous === null) {
            return null;
        }
        return round4(latest - previous);
    };

    const origin = summarize(originObservations);
    const destination = summarize(destinationObservations);
    const evaluated = origin !== null || destination !== null;

    return {
        status: evaluated ? 'EVALUATED' : 'INSUFFICIENT_DATA',
        origin,
        destination,
        change: evaluated
            ? {
                  originDelta: delta(originObservations),
                  destinationDelta: delta(destinationObservations),
              }
            : null,
    };
}

/**
 * Factor 2 (DOCUMENTED): weather.
 * INFERRED matching strategy: free-text WeatherObservation.location is matched
 * case-insensitively against the destination Port.name (the schema defines no
 * port<->weather join). UNSPECIFIED: any severity/storm threshold — not applied.
 */
async function evaluateWeather(destinationPort) {
    const observations = await prisma.weatherObservation.findMany({
        orderBy: { observedAt: 'desc' },
    });

    const target = String(destinationPort && destinationPort.name ? destinationPort.name : '')
        .trim()
        .toLowerCase();
    const match = observations.find(
        (observation) =>
            String(observation.location || '').trim().toLowerCase() === target
    );

    if (!match) {
        return { status: 'INSUFFICIENT_DATA', observation: null };
    }

    return {
        status: 'EVALUATED',
        observation: {
            location: match.location,
            windSpeed: toNumber(match.windSpeed),
            rainfall: toNumber(match.rainfall),
            stormIndicator: match.stormIndicator === true,
            severity: match.severity || null,
            observedAt: match.observedAt,
        },
    };
}

/**
 * Factor 3 (DOCUMENTED): freight volatility.
 * Descriptive, coefficient-free reporting of route freight rates and the
 * latest forecast spread. UNSPECIFIED: any volatility metric or level mapping.
 */
async function evaluateFreightVolatility(cargo, latestForecast) {
    const rates = await prisma.freightRate.findMany({
        where: {
            originPortId: cargo.originPortId,
            destinationPortId: cargo.destinationPortId,
        },
        orderBy: { observedAt: 'desc' },
    });

    const rateValues = rates
        .map((rate) => toNumber(rate.rateValue))
        .filter((value) => value !== null);

    let forecastSpread = null;
    if (
        latestForecast &&
        Array.isArray(latestForecast.forecastJson) &&
        latestForecast.forecastJson.length > 0
    ) {
        const predictions = latestForecast.forecastJson
            .map((p) => toNumber(p.predictedRate))
            .filter((value) => value !== null);
        if (predictions.length > 0) {
            forecastSpread = {
                min: Math.min(...predictions),
                max: Math.max(...predictions),
            };
        }
    }

    if (rateValues.length === 0 && !forecastSpread) {
        return {
            status: 'INSUFFICIENT_DATA',
            observationCount: 0,
            latestRate: null,
            minRate: null,
            maxRate: null,
            forecastSpread: null,
        };
    }

    return {
        status: 'EVALUATED',
        observationCount: rateValues.length,
        latestRate: rateValues.length > 0 ? rateValues[0] : null,
        minRate: rateValues.length > 0 ? Math.min(...rateValues) : null,
        maxRate: rateValues.length > 0 ? Math.max(...rateValues) : null,
        forecastSpread,
    };
}

/**
 * Factor 4 (DOCUMENTED): vessel availability.
 * Counts by Vessel.availabilityStatus plus total VesselAvailability windows.
 * UNSPECIFIED: any availability threshold — not applied.
 */
async function evaluateVesselAvailability() {
    const [vessels, availabilityWindows] = await Promise.all([
        prisma.vessel.findMany(),
        prisma.vesselAvailability.findMany(),
    ]);

    const vesselsByStatus = {};
    for (const vessel of vessels) {
        const status = vessel.availabilityStatus;
        vesselsByStatus[status] = (vesselsByStatus[status] || 0) + 1;
    }

    return {
        status: 'EVALUATED',
        vesselsByStatus,
        availabilityWindowCount: availabilityWindows.length,
    };
}

/**
 * Factor 5 (DOCUMENTED factor, UNSPECIFIED catalog): approved event signals.
 * No document defines which events are approved, so this factor is permanently
 * NOT_EVALUABLE until the team supplies an approved catalog.
 */
function evaluateEventSignals() {
    return {
        status: 'NOT_EVALUABLE',
        reason: 'NO_APPROVED_EVENT_SIGNAL_CATALOG_DOCUMENTED',
    };
}

/**
 * PHASE_2_7_CONSERVATIVE_MOCK (approved Option A):
 * - overallLevel defaults to LOW.
 * - Sole escalation (INFERRED, Phase 2.3 precedent): latest forecast
 *   confidence < 0.7 => MEDIUM.
 * - HIGH is unreachable in Phase 2.7: no documented threshold produces it.
 * - No numeric score is emitted (UNSPECIFIED).
 */
function aggregateOverallLevel(latestForecast) {
    const confidence =
        latestForecast && latestForecast.confidence !== null && latestForecast.confidence !== undefined
            ? toNumber(latestForecast.confidence)
            : null;

    const confidenceEscalationApplied =
        confidence !== null && confidence < CONFIDENCE_ESCALATION_THRESHOLD;

    return {
        overallLevel: confidenceEscalationApplied ? 'MEDIUM' : 'LOW',
        confidenceEscalationApplied,
        forecastConfidence: confidence,
    };
}

/**
 * Shared pipeline for POST /api/risk/analyze and GET /api/risk/:cargoRequestId.
 * Stateless: nothing is persisted (no risk table is documented).
 */
async function analyzeRisk(user, data) {
    const cargo = await prisma.cargoRequest.findUnique({
        where: { id: data.cargoRequestId },
        include: {
            destinationPort: true,
        },
    });

    if (!cargo) {
        throw new AppError(404, 'NOT_FOUND', 'Cargo request not found');
    }

    if (!checkRiskAccess(cargo, user)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions to assess risk for this cargo request');
    }

    const latestForecast = await prisma.forecastRecord.findFirst({
        where: { cargoRequestId: cargo.id },
        orderBy: { createdAt: 'desc' },
    });

    // Data-sufficiency gate (INFERRED, mirrors Phase 2.6): at least one freight
    // signal source must exist. Individual factors still degrade gracefully.
    if (!latestForecast) {
        const routeRate = await prisma.freightRate.findFirst({
            where: {
                originPortId: cargo.originPortId,
                destinationPortId: cargo.destinationPortId,
            },
            orderBy: { observedAt: 'desc' },
        });

        if (!routeRate) {
            throw new AppError(
                400,
                'INSUFFICIENT_DATA',
                'No forecast record found for this cargo request and no observed freight rate available for the route'
            );
        }
    }

    const [congestion, weather, freightVolatility, vesselAvailability] = await Promise.all([
        evaluateCongestion(cargo.originPortId, cargo.destinationPortId),
        evaluateWeather(cargo.destinationPort),
        evaluateFreightVolatility(cargo, latestForecast),
        evaluateVesselAvailability(),
    ]);

    const aggregation = aggregateOverallLevel(latestForecast);

    const assessment = {
        cargoRequestId: cargo.id,
        assessedAt: new Date().toISOString(),
        overallLevel: aggregation.overallLevel,
        // DOCUMENTED rule ("High risk should trigger review/alert"); dormant
        // under Option A because HIGH is unreachable in Phase 2.7.
        reviewRequired: aggregation.overallLevel === 'HIGH',
        factors: {
            congestion,
            weather,
            freightVolatility,
            vesselAvailability,
            eventSignals: evaluateEventSignals(),
        },
        basis: {
            forecastConfidence: aggregation.forecastConfidence,
            confidenceEscalationApplied: aggregation.confidenceEscalationApplied,
            aggregationPolicy: AGGREGATION_POLICY,
        },
        disclaimer: DISCLAIMER,
    };

    logger.info('Risk assessment completed', {
        cargoRequestId: cargo.id,
        overallLevel: assessment.overallLevel,
    });

    return assessment;
}

module.exports = {
    analyzeRisk,
    evaluateCongestion,
    evaluateWeather,
    evaluateFreightVolatility,
    evaluateVesselAvailability,
    evaluateEventSignals,
    aggregateOverallLevel,
};