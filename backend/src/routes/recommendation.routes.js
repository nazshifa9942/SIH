const express = require('express');
const recommendationController = require('../controllers/recommendation.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { createRecommendationSchema } = require('../validators/recommendation.validator');
const { uuidParamSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post(
    '/',
    requireAuth,
    validate(createRecommendationSchema, 'body'),
    recommendationController.generateRecommendation
);

router.get(
    '/:id',
    requireAuth,
    validate(uuidParamSchema, 'params'),
    recommendationController.getRecommendationById
);

module.exports = router;
