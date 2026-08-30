const express = require('express');
const marketController = require('../controllers/market.controller');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const {
    getFreightQuerySchema,
    getFuelQuerySchema,
    getCommodityQuerySchema,
    getEconomicQuerySchema,
} = require('../validators/market.validator');

const router = express.Router();

router.get(
    '/freight',
    requireAuth,
    validate(getFreightQuerySchema, 'query'),
    marketController.getFreightRates
);

router.get(
    '/fuel',
    requireAuth,
    validate(getFuelQuerySchema, 'query'),
    marketController.getFuelPrices
);

router.get(
    '/commodity',
    requireAuth,
    validate(getCommodityQuerySchema, 'query'),
    marketController.getCommodityPrices
);

router.get(
    '/economic',
    requireAuth,
    validate(getEconomicQuerySchema, 'query'),
    marketController.getEconomicIndicators
);

module.exports = router;
