const OPTIMIZATION_SERVICE_URL =
  process.env.OPTIMIZATION_SERVICE_URL || 'http://localhost:8001';

// Keep the Phase 2.3 cargo-only recommendation path unchanged.
// The real optimization service is used only for the full vessel-plan path.
const legacyMock = require('./optimization.mock');

function serializeForJson(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(serializeForJson);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if (typeof value.toNumber === 'function') {
      return value.toNumber();
    }

    const output = {};
    for (const [key, child] of Object.entries(value)) {
      output[key] = serializeForJson(child);
    }
    return output;
  }

  return value;
}

async function planVesselPlan(assembledInput) {
  const payload = serializeForJson(assembledInput);

  const response = await fetch(
    `${OPTIMIZATION_SERVICE_URL}/optimize/vessel-plan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Optimization service error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

function getOptimizationClient() {
  return {
    planVesselPlan,
  };
}

// Compatibility export for Phase 2.3 recommendations.
// Do NOT use this function for the Optimization dashboard.
async function planVessels(cargoRequest) {
  return legacyMock.planVessels(cargoRequest);
}

module.exports = {
  getOptimizationClient,
  planVesselPlan,
  planVessels,
};
