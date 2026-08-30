const express = require('express');
const vesselController = require('../controllers/vessel.controller');
const idleController = require('../controllers/idle.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { createVesselSchema, updateVesselSchema } = require('../validators/vessel.validator');
const {
  analyzeIdleSchema,
  analyzeRepositioningSchema,
} = require('../validators/idle.validator');
const { uuidParamSchema } = require('../validators/auth.validator');
const { ROLES } = require('../utils/roles');

const router = express.Router();

// Phase 2.8 — Idle / Repositioning analyses (observational, stateless).
router.post(
  '/idle-analysis',
  requireAuth,
  validate(analyzeIdleSchema, 'body'),
  idleController.analyzeIdle
);

router.post(
  '/repositioning-analysis',
  requireAuth,
  validate(analyzeRepositioningSchema, 'body'),
  idleController.analyzeRepositioning
);

router.post(
  '/',
  requireAuth,
  requireRole(ROLES.ADMIN),
  validate(createVesselSchema),
  vesselController.createVessel
);

router.get(
  '/',
  requireAuth,
  vesselController.listVessels
);

router.get(
  '/:id/availability',
  requireAuth,
  validate(uuidParamSchema, 'params'),
  vesselController.getVesselAvailability
);

router.get(
  '/:id',
  requireAuth,
  validate(uuidParamSchema, 'params'),
  vesselController.getVesselById
);

router.put(
  '/:id',
  requireAuth,
  requireRole(ROLES.ADMIN),
  validate(uuidParamSchema, 'params'),
  validate(updateVesselSchema),
  vesselController.updateVessel
);

module.exports = router;
