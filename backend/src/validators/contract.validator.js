const Joi = require('joi');

const compareContractsSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

const cargoRequestIdParamSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

module.exports = {
    compareContractsSchema,
    cargoRequestIdParamSchema,
};