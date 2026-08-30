const optimizationService = require('../services/optimization/optimization.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const createVesselPlan = asyncHandler(async (req, res) => {
  const result = await optimizationService.createVesselPlan(req.user, req.body);
  return sendSuccess(res, result, 'Vessel plan generated successfully', 201);
});

module.exports = {
  createVesselPlan,
};
