const express = require('express');

const authRoutes = require('./auth.routes');

const healthRoutes = require('./health.routes');

const cargoRoutes = require('./cargo.routes');

const portRoutes = require('./port.routes');

const marketRoutes = require('./market.routes');

const forecastRoutes = require('./forecast.routes');

const recommendationRoutes = require('./recommendation.routes');

const vesselRoutes = require('./vessel.routes');

const optimizationRoutes = require('./optimization.routes');

const costRoutes = require('./cost.routes');

const riskRoutes = require('./risk.routes');

const contractRoutes = require('./contract.routes');

const alertRoutes = require('./alert.routes');

const whatIfRoutes = require('./whatIf.routes');

const router = express.Router();

router.use('/health', healthRoutes);

router.use('/auth', authRoutes);

router.use('/cargo', cargoRoutes);

router.use('/ports', portRoutes);

router.use('/vessels', vesselRoutes);

router.use('/market', marketRoutes);

router.use('/forecast', forecastRoutes);

router.use('/recommendations', recommendationRoutes);

router.use('/optimization', optimizationRoutes);

router.use('/cost', costRoutes);

router.use('/risk', riskRoutes);

router.use('/contracts', contractRoutes);

router.use('/alerts', alertRoutes);

router.use('/what-if', whatIfRoutes);

module.exports = router;