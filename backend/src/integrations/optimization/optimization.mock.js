const AppError = require('../../utils/AppError');

/**
 * Cargo-only stub used by Phase 2.3 recommendations.
 * Must remain compatible: feasible true, totalEstimatedCost 13800000.
 */
async function planVessels(cargoRequest) {
  return {
    feasible: true,
    recommendedPlan: [
      {
        vesselId: '00000000-0000-4000-c000-000000000001',
        vesselName: 'Mock Vessel One',
        tripNumber: 1,
        quantityMT: cargoRequest ? parseFloat(cargoRequest.quantityMt) : 50000,
      },
    ],
    numberOfTrips: 1,
    totalEstimatedCost: 13800000.0,
    constraintChecks: [],
    alternatives: [],
  };
}

function selectLargestCapacityVessel(vessels) {
  return [...vessels].sort((a, b) => {
    const capacityDiff = parseFloat(b.capacityMt) - parseFloat(a.capacityMt);
    if (capacityDiff !== 0) {
      return capacityDiff;
    }
    const nameA = a.name || '';
    const nameB = b.name || '';
    if (nameA !== nameB) {
      return nameA.localeCompare(nameB);
    }
    return String(a.id).localeCompare(String(b.id));
  })[0];
}

function buildTrips(vessel, quantityMt) {
  const capacity = parseFloat(vessel.capacityMt);
  const quantity = parseFloat(quantityMt);

  if (!(capacity > 0) || !(quantity > 0)) {
    return [];
  }

  if (capacity >= quantity) {
    return [
      {
        vesselId: vessel.id,
        tripNumber: 1,
        quantityMT: quantity,
      },
    ];
  }

  const tripCount = Math.ceil(quantity / capacity);
  const trips = [];
  let remaining = quantity;

  for (let tripNumber = 1; tripNumber <= tripCount; tripNumber += 1) {
    const tripQuantity = tripNumber === tripCount ? remaining : Math.min(capacity, remaining);
    trips.push({
      vesselId: vessel.id,
      tripNumber,
      quantityMT: tripQuantity,
    });
    remaining -= tripQuantity;
  }

  return trips;
}

/**
 * Full vessel-plan path. Geometric filtering is applied by the caller via
 * feasibleVessels; this mock selects capacity and splits trips.
 * Cost remains the documented Phase 2 placeholder (not a real cost module).
 */
async function planVesselPlan(assembledInput) {
  if (!assembledInput) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Missing vessel-plan inputs');
  }

  const constraintChecks = assembledInput.constraintChecks || [];
  const feasibleVessels = assembledInput.feasibleVessels || [];
  const cargo = assembledInput.cargo;

  if (!cargo || feasibleVessels.length === 0) {
    return {
      feasible: false,
      recommendedPlan: [],
      numberOfTrips: 0,
      totalEstimatedCost: 13800000.0,
      constraintChecks,
      alternatives: [],
    };
  }

  const selected = selectLargestCapacityVessel(feasibleVessels);
  const recommendedPlan = buildTrips(selected, cargo.quantityMt);

  if (recommendedPlan.length === 0) {
    return {
      feasible: false,
      recommendedPlan: [],
      numberOfTrips: 0,
      totalEstimatedCost: 13800000.0,
      constraintChecks,
      alternatives: [],
    };
  }

  return {
    feasible: true,
    recommendedPlan,
    numberOfTrips: recommendedPlan.length,
    totalEstimatedCost: 13800000.0,
    constraintChecks,
    alternatives: [],
  };
}

module.exports = {
  planVessels,
  planVesselPlan,
};
