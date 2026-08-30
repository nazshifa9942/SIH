/**
 * ML client facade.
 * Phase 3 will call the Python/FastAPI ML service using ML_CONTRACT.md.
 * Until then, the mock client is used.
 */
const mock = require('./ml.mock');

function getMlClient() {
  return mock;
}

module.exports = {
  getMlClient,
};
