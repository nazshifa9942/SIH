const marketService = require('../services/market/market.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const getFreightRates = asyncHandler(async (req, res) => {
    const result = await marketService.getFreightRates(req.query);
    return sendSuccess(res, result, 'Freight rates retrieved successfully');
});

const getFuelPrices = asyncHandler(async (req, res) => {
    const result = await marketService.getFuelPrices(req.query);
    return sendSuccess(res, result, 'Fuel prices retrieved successfully');
});

const getCommodityPrices = asyncHandler(async (req, res) => {
    const result = await marketService.getCommodityPrices(req.query);
    return sendSuccess(res, result, 'Commodity prices retrieved successfully');
});

const getEconomicIndicators = asyncHandler(async (req, res) => {
    const result = await marketService.getEconomicIndicators(req.query);
    return sendSuccess(res, result, 'Economic indicators retrieved successfully');
});

module.exports = {
    getFreightRates,
    getFuelPrices,
    getCommodityPrices,
    getEconomicIndicators,
};
