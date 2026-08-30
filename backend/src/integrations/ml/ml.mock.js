const AppError = require('../../utils/AppError');

/**
 * Placeholder ML client. Real forecasts are Phase 3.
 * Generates simulated forecasts following the contract in ML_CONTRACT.md.
 */
async function forecastFreight(payload) {
  if (!payload || !payload.features || payload.features.currentFreightRate === undefined) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Missing required feature inputs for forecasting (currentFreightRate)'
    );
  }

  const currentFreightRate = parseFloat(payload.features.currentFreightRate);
  const requestId = payload.requestId || 'REQ-MOCK';
  const horizon = payload.forecastHorizonDays || 14;

  const forecast = [];
  const today = new Date();

  for (let i = 1; i <= horizon; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    const dateStr = nextDate.toISOString().split('T')[0];

    // Simple oscillating mock rate: baseRate + sin(i) * 5% fluctuation
    const deviationFraction = Math.sin(i) * 0.05;
    const predictedRate = Math.round((currentFreightRate + (currentFreightRate * deviationFraction)) * 100) / 100;

    forecast.push({
      date: dateStr,
      predictedRate,
    });
  }

  return {
    requestId,
    modelVersion: 'freight-v1-mock',
    forecast,
    confidence: 0.85,
  };
}

module.exports = {
  forecastFreight,
};
