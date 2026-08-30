const express = require('express');
const portController = require('../controllers/port.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { createPortSchema, updatePortSchema } = require('../validators/port.validator');
const { uuidParamSchema } = require('../validators/auth.validator');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.post(
    '/',
    requireAuth,
    requireRole(ROLES.ADMIN),
    validate(createPortSchema),
    portController.createPort
);

router.get(
    '/',
    requireAuth,
    portController.listPorts
);

router.get(
    '/:id',
    requireAuth,
    validate(uuidParamSchema, 'params'),
    portController.getPortById
);

router.put(
    '/:id',
    requireAuth,
    requireRole(ROLES.ADMIN),
    validate(uuidParamSchema, 'params'),
    validate(updatePortSchema),
    portController.updatePort
);

module.exports = router;
