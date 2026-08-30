const Joi = require('joi');

const createForecastSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
    forecastHorizonDays: Joi.number().integer().min(1).max(90).default(14).optional(),
});

module.exports = {
    createForecastSchema,
};
