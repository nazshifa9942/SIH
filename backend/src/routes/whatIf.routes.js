const express = require('express');

const whatIfController = require('../controllers/whatIf.controller');

const validate = require('../middleware/validate.middleware');

const { requireAuth } = require('../middleware/auth.middleware');

const {
  createWhatIfScenarioSchema,
  updateWhatIfScenarioSchema,
} = require('../validators/whatIf.validator');
const { cargoRequestIdParamSchema, uuidParamSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post(
  '/scenarios',
  requireAuth,
  validate(createWhatIfScenarioSchema, 'body'),
  whatIfController.createWhatIfScenario
);

router.get('/scenarios/cargo/:cargoRequestId', requireAuth, validate(cargoRequestIdParamSchema, 'params'), whatIfController.listWhatIfScenarios);
router.get('/scenarios/:id', requireAuth, validate(uuidParamSchema, 'params'), whatIfController.getWhatIfScenario);
router.put('/scenarios/:id', requireAuth, validate(uuidParamSchema, 'params'), validate(updateWhatIfScenarioSchema, 'body'), whatIfController.updateWhatIfScenario);
router.delete('/scenarios/:id', requireAuth, validate(uuidParamSchema, 'params'), whatIfController.deleteWhatIfScenario);
router.post('/scenarios/:id/run', requireAuth, validate(uuidParamSchema, 'params'), whatIfController.runWhatIfScenario);

module.exports = router;