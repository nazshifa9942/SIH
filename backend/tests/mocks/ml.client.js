/**
 * Test double for src/integrations/ml/ml.client.
 *
 * The production client calls the real Python XGBoost service
 * (ML_SERVICE_URL, default http://localhost:8000). Integration tests must
 * stay hermetic, so this module is swapped in via tests/setupMocks.js.
 *
 * Response contract matches the real FastAPI /predict endpoint:
 * { success, prediction, unit, model, date }
 */

function predictFreight(payload) {
  return Promise.resolve({
    success: true,
    prediction: 23.5,
    unit: 'USD/Tonne',
    model: 'freight-v1-mock',
    date: (payload && payload.date) || null,
  });
}

function getMlClient() {
  return {
    predictFreight,
  };
}

module.exports = {
  predictFreight,
  getMlClient,
};
