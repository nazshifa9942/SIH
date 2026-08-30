/**
 * Optimization client facade.
 * Phase 3 will call the Python/OR-Tools service using OPTIMIZATION_CONTRACT.md.
 * Until then, the mock client is used.
 *
 * planVessels(cargo) is the Phase 2.3-compatible cargo-only stub.
 */
const mock = require('./optimization.mock');

function getOptimizationClient() {
  return mock;
}

async function planVessels(cargoRequest) {
  return mock.planVessels(cargoRequest);
}

module.exports = {
  getOptimizationClient,
  planVessels,
};
