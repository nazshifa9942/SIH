const Joi = require('joi');

const analyzeRiskSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

const cargoRequestIdParamSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

module.exports = {
    analyzeRiskSchema,
    cargoRequestIdParamSchema,
};