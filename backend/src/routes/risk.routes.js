const express = require('express');
const riskController = require('../controllers/risk.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const {
    analyzeRiskSchema,
    cargoRequestIdParamSchema,
} = require('../validators/risk.validator');

const router = express.Router();

router.post(
    '/analyze',
    requireAuth,
    validate(analyzeRiskSchema, 'body'),
    riskController.analyzeRisk
);

router.get(
    '/:cargoRequestId',
    requireAuth,
    validate(cargoRequestIdParamSchema, 'params'),
    riskController.getRiskByCargoId
);

module.exports = router;