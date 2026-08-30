const express = require('express');
const contractController = require('../controllers/contract.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const {
    compareContractsSchema,
    cargoRequestIdParamSchema,
} = require('../validators/contract.validator');

const router = express.Router();

router.post(
    '/compare',
    requireAuth,
    validate(compareContractsSchema, 'body'),
    contractController.compareContracts
);

router.get(
    '/:cargoRequestId',
    requireAuth,
    validate(cargoRequestIdParamSchema, 'params'),
    contractController.getContractComparison
);

module.exports = router;