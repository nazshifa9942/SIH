const express = require('express');
const costController = require('../controllers/cost.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const {
    createCostEstimateSchema,
    cargoRequestIdParamSchema,
} = require('../validators/cost.validator');

const router = express.Router();

router.post(
    '/estimate',
    requireAuth,
    validate(createCostEstimateSchema, 'body'),
    costController.computeCostEstimate
);

router.get(
    '/:cargoRequestId',
    requireAuth,
    validate(cargoRequestIdParamSchema, 'params'),
    costController.getCostBreakdownsByCargoId
);

module.exports = router;