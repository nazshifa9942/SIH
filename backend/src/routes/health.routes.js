const express = require('express');
const { sendSuccess } = require('../utils/apiResponse');
const { checkDatabase } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const database = await checkDatabase();
    return sendSuccess(
      res,
      {
        status: 'ok',
        service: 'sih26006-backend',
        database,
        timestamp: new Date().toISOString(),
      },
      'Backend is running'
    );
  })
);

module.exports = router;
