const Joi = require('joi');

const createCostEstimateSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
    voyagePlanId: Joi.string().uuid().optional().allow(null),
});

const cargoRequestIdParamSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

module.exports = {
    createCostEstimateSchema,
    cargoRequestIdParamSchema,
};