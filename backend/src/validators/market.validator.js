const Joi = require('joi');

const getFreightQuerySchema = Joi.object({
    originPortId: Joi.string().uuid().optional(),
    destinationPortId: Joi.string().uuid().optional(),
    vesselType: Joi.string().trim().max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
});

const getFuelQuerySchema = Joi.object({
    fuelType: Joi.string().trim().max(100).optional(),
    region: Joi.string().trim().max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
});

const getCommodityQuerySchema = Joi.object({
    commodity: Joi.string().trim().max(100).optional(),
    market: Joi.string().trim().max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
});

const getEconomicQuerySchema = Joi.object({
    indicatorName: Joi.string().trim().max(120).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
});

module.exports = {
    getFreightQuerySchema,
    getFuelQuerySchema,
    getCommodityQuerySchema,
    getEconomicQuerySchema,
};
