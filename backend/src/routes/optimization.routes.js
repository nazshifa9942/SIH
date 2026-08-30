const express = require('express');
const optimizationController = require('../controllers/optimization.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { createVesselPlanSchema } = require('../validators/optimization.validator');

const router = express.Router();

router.post(
  '/vessel-plan',
  requireAuth,
  validate(createVesselPlanSchema, 'body'),
  optimizationController.createVesselPlan
);

module.exports = router;
