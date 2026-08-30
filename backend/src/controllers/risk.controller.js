const riskService = require('../services/risk/risk.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const analyzeRisk = asyncHandler(async (req, res) => {
    const result = await riskService.analyzeRisk(req.user, req.body);
    return sendSuccess(res, result, 'Risk assessment completed successfully');
});

const getRiskByCargoId = asyncHandler(async (req, res) => {
    const result = await riskService.analyzeRisk(req.user, {
        cargoRequestId: req.params.cargoRequestId,
    });
    return sendSuccess(res, result, 'Risk assessment completed successfully');
});

module.exports = {
    analyzeRisk,
    getRiskByCargoId,
};