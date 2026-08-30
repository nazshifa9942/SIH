const Joi = require('joi');

const createVesselSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  vesselType: Joi.string().trim().min(1).max(100).required(),
  capacityMt: Joi.number().positive().precision(3).required(),
  draftM: Joi.number().positive().precision(3).required(),
  loaM: Joi.number().positive().precision(3).required(),
  beamM: Joi.number().positive().precision(3).required(),
  speedKnots: Joi.number().positive().precision(3).optional(),
  fuelConsumption: Joi.number().positive().precision(4).optional(),
  dailyCharterCost: Joi.number().positive().precision(2).optional(),
  availabilityStatus: Joi.string().trim().min(1).max(100).required(),
});

const updateVesselSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  vesselType: Joi.string().trim().min(1).max(100).optional(),
  capacityMt: Joi.number().positive().precision(3).optional(),
  draftM: Joi.number().positive().precision(3).optional(),
  loaM: Joi.number().positive().precision(3).optional(),
  beamM: Joi.number().positive().precision(3).optional(),
  speedKnots: Joi.number().positive().precision(3).optional(),
  fuelConsumption: Joi.number().positive().precision(4).optional(),
  dailyCharterCost: Joi.number().positive().precision(2).optional(),
  availabilityStatus: Joi.string().trim().min(1).max(100).optional(),
}).min(1);

module.exports = {
  createVesselSchema,
  updateVesselSchema,
};
