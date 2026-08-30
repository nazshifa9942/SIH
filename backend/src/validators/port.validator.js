const Joi = require('joi');

const createPortSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  country: Joi.string().trim().min(2).max(100).required(),
  region: Joi.string().trim().max(100).allow(null, '').optional(),
  maxDraftM: Joi.number().positive().precision(3).required(),
  maxLoaM: Joi.number().positive().precision(3).required(),
  maxBeamM: Joi.number().positive().precision(3).required(),
  handlingCapacityMtDay: Joi.number().positive().precision(3).required(),
  berthCapacity: Joi.number().integer().min(0).required(),
  active: Joi.boolean().default(true).optional(),
});

const updatePortSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  country: Joi.string().trim().min(2).max(100).optional(),
  region: Joi.string().trim().max(100).allow(null, '').optional(),
  maxDraftM: Joi.number().positive().precision(3).optional(),
  maxLoaM: Joi.number().positive().precision(3).optional(),
  maxBeamM: Joi.number().positive().precision(3).optional(),
  handlingCapacityMtDay: Joi.number().positive().precision(3).optional(),
  berthCapacity: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional(),
}).min(1); // must modify at least one field

module.exports = {
  createPortSchema,
  updatePortSchema,
};
