const express = require('express');
const { listAlerts } = require('../controllers/alert.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/', requireAuth, listAlerts);

module.exports = router;
