const express = require('express');
const Joi = require('joi');
const forecastController = require('../controllers/forecast.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { createForecastSchema } = require('../validators/forecast.validator');

const router = express.Router();

const cargoRequestIdParamSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

router.post(
    '/freight',
    requireAuth,
    validate(createForecastSchema, 'body'),
    forecastController.generateForecast
);

router.get(
    '/:cargoRequestId',
    requireAuth,
    validate(cargoRequestIdParamSchema, 'params'),
    forecastController.getForecastByCargoId
);

module.exports = router;
