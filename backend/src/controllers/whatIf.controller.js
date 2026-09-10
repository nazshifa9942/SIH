const whatIfService = require('../services/whatIf/whatIf.service');

async function createWhatIfScenario(req, res, next) {
  try {
    const scenario = await whatIfService.createWhatIfScenario(
      req.user,
      req.body
    );

    return res.status(201).json({
      success: true,
      data: scenario,
    });
  } catch (error) {
    return next(error);
  }
}

async function listWhatIfScenarios(req, res, next) {
  try { return res.json({ success: true, data: await whatIfService.listWhatIfScenarios(req.user, req.params.cargoRequestId) }); } catch (error) { return next(error); }
}

async function getWhatIfScenario(req, res, next) {
  try { return res.json({ success: true, data: await whatIfService.getScenario(req.user, req.params.id) }); } catch (error) { return next(error); }
}

async function updateWhatIfScenario(req, res, next) {
  try { return res.json({ success: true, data: await whatIfService.updateWhatIfScenario(req.user, req.params.id, req.body) }); } catch (error) { return next(error); }
}

async function deleteWhatIfScenario(req, res, next) {
  try { return res.json({ success: true, data: await whatIfService.deleteWhatIfScenario(req.user, req.params.id) }); } catch (error) { return next(error); }
}

async function runWhatIfScenario(req, res, next) {
  try { return res.json({ success: true, data: await whatIfService.runWhatIfScenario(req.user, req.params.id) }); } catch (error) { return next(error); }
}

module.exports = {
  createWhatIfScenario,
  listWhatIfScenarios,
  getWhatIfScenario,
  updateWhatIfScenario,
  deleteWhatIfScenario,
  runWhatIfScenario,
};