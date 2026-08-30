const recommendationService = require('../services/recommendation/recommendation.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const generateRecommendation = asyncHandler(async (req, res) => {
    const result = await recommendationService.generateRecommendation(req.user, req.body);
    return sendSuccess(res, result, 'Recommendation generated successfully', 201);
});

const getRecommendationById = asyncHandler(async (req, res) => {
    const result = await recommendationService.getRecommendationById(req.params.id, req.user);
    return sendSuccess(res, result, 'Recommendation retrieved successfully');
});

const getRecommendationsByCargoId = asyncHandler(async (req, res) => {
    const result = await recommendationService.getRecommendationsByCargoId(req.params.cargoRequestId, req.user);
    return sendSuccess(res, result, 'Recommendations retrieved successfully');
});

module.exports = {
    generateRecommendation,
    getRecommendationById,
    getRecommendationsByCargoId,
};
