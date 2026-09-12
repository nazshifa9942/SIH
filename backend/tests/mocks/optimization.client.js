/**
 * Test double for src/integrations/optimization/optimization.client.
 *
 * The production client calls the real OR-Tools CP-SAT service
 * (OPTIMIZATION_SERVICE_URL, default http://localhost:8001). Integration
 * tests must stay hermetic, so this module is swapped in via
 * tests/setupMocks.js.
 *
 * It delegates to the legacy Phase 2 mock, which already implements the
 * documented behavior the tests assert: largest feasible vessel, sequential
 * trips summing to the cargo quantity, and the fixed charter-cost score of
 * 13800000 for a used plan (see
 * src/integrations/optimization/optimization.mock.js).
 */

const legacyMock = require('../../src/integrations/optimization/optimization.mock');

function planVesselPlan(assembledInput) {
  return legacyMock.planVesselPlan(assembledInput);
}

function planVessels(cargoRequest) {
  return legacyMock.planVessels(cargoRequest);
}

function getOptimizationClient() {
  return {
    planVesselPlan,
  };
}

module.exports = {
  getOptimizationClient,
  planVesselPlan,
  planVessels,
};
