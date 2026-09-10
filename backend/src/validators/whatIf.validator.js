const Joi = require('joi');

const createWhatIfScenarioSchema = Joi.object({
  cargoRequestId: Joi.string().uuid().required(),

  name: Joi.string().trim().min(1).max(100).required(),

  description: Joi.string().trim().max(500).allow('', null).optional(),

  quantityMt: Joi.number().positive().optional(),
  requiredDate: Joi.date().min('now').optional(),
  originPortId: Joi.string().uuid().optional(),
  destinationPortId: Joi.string().uuid().optional(),
});

const updateWhatIfScenarioSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  quantityMt: Joi.number().positive().optional(),
  requiredDate: Joi.date().min('now').optional(),
  originPortId: Joi.string().uuid().optional(),
  destinationPortId: Joi.string().uuid().optional(),
}).min(1);

module.exports = {
  createWhatIfScenarioSchema,
  updateWhatIfScenarioSchema,
};