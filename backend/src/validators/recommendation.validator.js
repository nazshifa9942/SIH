const Joi = require('joi');

const createRecommendationSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

module.exports = {
    createRecommendationSchema,
};
