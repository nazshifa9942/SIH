const Joi = require('joi');

const createCargoSchema = Joi.object({
    cargoType: Joi.string().trim().min(1).max(100).required(),
    quantityMt: Joi.number().positive().precision(3).required(),
    originPortId: Joi.string().uuid().required(),
    destinationPortId: Joi.string().uuid().required(),
    requiredDate: Joi.date().required(),
    contractDuration: Joi.string().trim().max(100).allow(null, '').optional(),
});

const updateCargoSchema = Joi.object({
    cargoType: Joi.string().trim().min(1).max(100).optional(),
    quantityMt: Joi.number().positive().precision(3).optional(),
    originPortId: Joi.string().uuid().optional(),
    destinationPortId: Joi.string().uuid().optional(),
    requiredDate: Joi.date().optional(),
    contractDuration: Joi.string().trim().max(100).allow(null, '').optional(),
    status: Joi.string().trim().max(50).optional(),
}).min(1); // must modify at least one field

module.exports = {
    createCargoSchema,
    updateCargoSchema,
};
