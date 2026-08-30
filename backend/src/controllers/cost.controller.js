const costService = require('../services/cost/cost.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const computeCostEstimate = asyncHandler(async (req, res) => {
    const result = await costService.computeCostEstimate(req.user, req.body);
    return sendSuccess(res, result, 'Cost estimate generated successfully', 201);
});

const getCostBreakdownsByCargoId = asyncHandler(async (req, res) => {
    const result = await costService.getCostBreakdownsByCargoId(
        req.params.cargoRequestId,
        req.user
    );
    return sendSuccess(res, result, 'Cost breakdowns retrieved successfully');
});

module.exports = {
    computeCostEstimate,
    getCostBreakdownsByCargoId,
};