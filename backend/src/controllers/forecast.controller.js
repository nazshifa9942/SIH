const forecastService = require('../services/forecast/forecast.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const generateForecast = asyncHandler(async (req, res) => {
    const result = await forecastService.generateForecast(req.user, req.body);
    return sendSuccess(res, result, 'Forecast generated successfully', 201);
});

const getForecastByCargoId = asyncHandler(async (req, res) => {
    const result = await forecastService.getForecastByCargoId(req.params.cargoRequestId, req.user);
    return sendSuccess(res, result, 'Forecast retrieved successfully');
});

module.exports = {
    generateForecast,
    getForecastByCargoId,
};
