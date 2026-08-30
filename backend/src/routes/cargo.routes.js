const express = require('express');
const cargoController = require('../controllers/cargo.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { createCargoSchema, updateCargoSchema } = require('../validators/cargo.validator');
const { uuidParamSchema } = require('../validators/auth.validator');
const { ROLES } = require('../utils/roles');

const router = express.Router();

const recommendationController = require('../controllers/recommendation.controller');
const Joi = require('joi');

const cargoRequestIdParamSchema = Joi.object({
    cargoRequestId: Joi.string().uuid().required(),
});

router.post(
    '/',
    requireAuth,
    requireRole(ROLES.PROCUREMENT_MANAGER, ROLES.ADMIN),
    validate(createCargoSchema),
    cargoController.createCargo
);

router.get(
    '/',
    requireAuth,
    cargoController.listCargo
);

router.get(
    '/:id',
    requireAuth,
    validate(uuidParamSchema, 'params'),
    cargoController.getCargoById
);

router.put(
    '/:id',
    requireAuth,
    validate(uuidParamSchema, 'params'),
    validate(updateCargoSchema),
    cargoController.updateCargo
);

router.delete(
    '/:id',
    requireAuth,
    validate(uuidParamSchema, 'params'),
    cargoController.deleteCargo
);

router.get(
    '/:cargoRequestId/recommendations',
    requireAuth,
    validate(cargoRequestIdParamSchema, 'params'),
    recommendationController.getRecommendationsByCargoId
);

module.exports = router;

