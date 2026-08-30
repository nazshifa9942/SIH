const Joi = require('joi');

const analyzeIdleSchema = Joi.object({
    vesselId: Joi.string().uuid().required(),
});

const analyzeRepositioningSchema = Joi.object({
    vesselId: Joi.string().uuid().required(),
    targetPortId: Joi.string().uuid().required(),
});

module.exports = {
    analyzeIdleSchema,
    analyzeRepositioningSchema,
};