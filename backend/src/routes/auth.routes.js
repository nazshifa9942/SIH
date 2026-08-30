const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { sendSuccess } = require('../utils/apiResponse');
const env = require('../config/env');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.me);

if (env.isTest) {
  router.get(
    '/role-check',
    requireAuth,
    requireRole(ROLES.ADMIN),
    (req, res) => sendSuccess(res, { authorized: true }, 'Role authorized')
  );
}

module.exports = router;
