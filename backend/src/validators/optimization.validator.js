const Joi = require('joi');

const createVesselPlanSchema = Joi.object({
  cargoRequestId: Joi.string().uuid().required(),
});

module.exports = {
  createVesselPlanSchema,
};
