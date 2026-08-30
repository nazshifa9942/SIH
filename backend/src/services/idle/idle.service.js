const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');

/**
 * Phase 2.8 — Vessel Idle-Time & Repositioning.
 *
 * Formula classification (see approved implementation plan):
 * - Factor list (vessel location, availability, idle days, repositioning
 *   distance and cost): DOCUMENTED (PROJECT_SPEC.md Feature 8).
 * - currentLocation = current_location of latest VesselAvailability
 *   observation (observedAt DESC): INFERRED (codebase convention).
 * - idleDays = sum of durations of CLOSED availability windows; open-ended
 *   windows excluded and reported separately: INFERRED (minimal arithmetic on
 *   documented fields; voyage-overlap impossible while VoyagePlan.eta is null).
 * - Any idle threshold / flag: UNSPECIFIED — not created.
 * - Distance computation: UNSPECIFIED (no coordinates, no distance table) —
 *   reported as NOT_COMPUTABLE with explicit reason. Never faked.
 * - Repositioning cost formula: UNSPECIFIED (units undefined per Phase 2.6
 *   finding) — estimatedRepositioningCost is a zero placeholder labeled
 *   ZERO_PLACEHOLDER_UNDOCUMENTED. dailyCharterCost echoed descriptively only.
 * - locationMatch heuristic: INFERRED (Phase 2.7 weather-match precedent);
 *   never affects any level/score.
 * - Persistence: none — DATABASE_SCHEMA.md defines no idle/repositioning table.
 * - No calls to optimization, cost, risk, recommendation or forecast modules.
 */

const IDLE_POLICY = 'PHASE_2_8_IDLE_MOCK';
const REPOSITIONING_POLICY = 'PHASE_2_8_REPOSITIONING_MOCK';
const ZERO_PLACEHOLDER_LABEL = 'ZERO_PLACEHOLDER_UNDOCUMENTED';

function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function round1(value) {
    return Math.round(value * 10) / 10;
}

function vesselIdentity(vessel) {
    return {
        id: vessel.id,
        name: vessel.name,
        vesselType: vessel.vesselType,
        availabilityStatus: vessel.availabilityStatus,
    };
}

/**
 * INFERRED: currentLocation comes from the latest availability observation
 * (ordered observedAt DESC); null when no observations exist.
 */
function resolveCurrentLocation(observations) {
    if (!observations || observations.length === 0) {
        return null;
    }
    const latest = observations[0];
    return latest.currentLocation || null;
}

/**
 * INFERRED: idleDays = sum of durations of closed availability windows
 * (availableUntil present). Open-ended windows are excluded from the sum and
 * returned separately. Durations in whole days (rounded to 1 decimal).
 */
function splitWindows(observations) {
    const closedWindows = [];
    const openEndedWindows = [];
    let idleDays = 0;

    for (const observation of observations || []) {
        if (observation.availableUntil !== null && observation.availableUntil !== undefined) {
            const fromMs = new Date(observation.availableFrom).getTime();
            const untilMs = new Date(observation.availableUntil).getTime();
            let days = 0;
            if (Number.isFinite(fromMs) && Number.isFinite(untilMs) && untilMs > fromMs) {
                days = round1((untilMs - fromMs) / (1000 * 60 * 60 * 24));
            }
            closedWindows.push({
                availableFrom: observation.availableFrom,
                availableUntil: observation.availableUntil,
                days,
            });
            idleDays += days;
        } else {
            openEndedWindows.push({
                availableFrom: observation.availableFrom,
            });
        }
    }

    return {
        closedWindows,
        openEndedWindows,
        idleDays: round1(idleDays),
    };
}

async function getVesselOrThrow(vesselId) {
    const vessel = await prisma.vessel.findUnique({
        where: { id: vesselId },
    });

    if (!vessel) {
        throw new AppError(404, 'NOT_FOUND', 'Vessel not found');
    }

    return vessel;
}

async function getAvailabilityObservations(vesselId) {
    return prisma.vesselAvailability.findMany({
        where: { vesselId },
        orderBy: { observedAt: 'desc' },
    });
}

/**
 * POST /api/vessels/idle-analysis
 * Stateless observational analysis; nothing is persisted.
 */
async function analyzeIdle(data) {
    const vessel = await getVesselOrThrow(data.vesselId);
    const observations = await getAvailabilityObservations(vessel.id);

    if (observations.length === 0) {
        logger.info('Idle analysis completed without availability data', {
            vesselId: vessel.id,
        });

        return {
            vessel: vesselIdentity(vessel),
            status: 'INSUFFICIENT_DATA',
            currentLocation: null,
            availabilityWindowCount: 0,
            closedWindows: [],
            openEndedWindows: [],
            idleDays: 0,
            basis: {
                policy: IDLE_POLICY,
                note: 'No availability observations found for this vessel.',
            },
        };
    }

    const { closedWindows, openEndedWindows, idleDays } = splitWindows(observations);

    logger.info('Idle analysis completed', {
        vesselId: vessel.id,
        idleDays,
        windowCount: observations.length,
    });

    return {
        vessel: vesselIdentity(vessel),
        status: 'EVALUATED',
        currentLocation: resolveCurrentLocation(observations),
        availabilityWindowCount: observations.length,
        closedWindows,
        openEndedWindows,
        idleDays,
        basis: {
            policy: IDLE_POLICY,
            note: 'Idle days computed as availability-window durations; open-ended windows excluded from the sum.',
        },
    };
}

/**
 * INFERRED heuristic (Phase 2.7 weather-match precedent): case-insensitive
 * comparison of currentLocation against the target port name. Null when the
 * current location is unknown. Never affects any level or score.
 */
function matchesLocation(currentLocation, portName) {
    if (!currentLocation) {
        return null;
    }
    return String(currentLocation).trim().toLowerCase() === String(portName || '').trim().toLowerCase();
}

/**
 * POST /api/vessels/repositioning-analysis
 * Stateless observational analysis; nothing is persisted.
 */
async function analyzeRepositioning(data) {
    const vessel = await getVesselOrThrow(data.vesselId);

    const targetPort = await prisma.port.findUnique({
        where: { id: data.targetPortId },
    });

    if (!targetPort) {
        throw new AppError(404, 'NOT_FOUND', 'Target port not found');
    }

    const observations = await getAvailabilityObservations(vessel.id);
    const currentLocation = resolveCurrentLocation(observations);

    // UNSPECIFIED: no distance data exists anywhere in the documentation
    // (no port coordinates, no distance table). Reported as NOT_COMPUTABLE.
    const distance = {
        status: 'NOT_COMPUTABLE',
        reason: 'NO_DISTANCE_DATA_DOCUMENTED',
    };

    // UNSPECIFIED: no repositioning cost formula is documented. Zero
    // placeholder, transparently labeled. dailyCharterCost is NOT used here.
    const estimatedRepositioningCost = 0;

    const referenceDailyCharterCost =
        vessel.dailyCharterCost !== null && vessel.dailyCharterCost !== undefined
            ? toNumber(vessel.dailyCharterCost)
            : null;

    logger.info('Repositioning analysis completed', {
        vesselId: vessel.id,
        targetPortId: targetPort.id,
        currentLocation,
    });

    return {
        vessel: vesselIdentity(vessel),
        status: observations.length > 0 ? 'EVALUATED' : 'INSUFFICIENT_DATA',
        currentLocation,
        targetPort: {
            id: targetPort.id,
            name: targetPort.name,
            country: targetPort.country,
        },
        locationMatch: matchesLocation(currentLocation, targetPort.name),
        distance,
        estimatedRepositioningCost,
        costBasis: {
            status: ZERO_PLACEHOLDER_LABEL,
        },
        referenceDailyCharterCost,
        basis: {
            policy: REPOSITIONING_POLICY,
            note: 'No distance data or cost formula is documented; values are reported observationally.',
        },
    };
}

module.exports = {
    analyzeIdle,
    analyzeRepositioning,
    resolveCurrentLocation,
    splitWindows,
    matchesLocation,
};