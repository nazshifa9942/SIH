const idleService = require('../services/idle/idle.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const analyzeIdle = asyncHandler(async (req, res) => {
    const result = await idleService.analyzeIdle(req.body);
    return sendSuccess(res, result, 'Idle analysis completed successfully');
});

const analyzeRepositioning = asyncHandler(async (req, res) => {
    const result = await idleService.analyzeRepositioning(req.body);
    return sendSuccess(res, result, 'Repositioning analysis completed successfully');
});

module.exports = {
    analyzeIdle,
    analyzeRepositioning,
};