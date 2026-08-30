const vesselService = require('../services/vessel/vessel.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const createVessel = asyncHandler(async (req, res) => {
  const result = await vesselService.createVessel(req.body);
  return sendSuccess(res, result, 'Vessel created successfully', 201);
});

const listVessels = asyncHandler(async (req, res) => {
  const result = await vesselService.listVessels(req.query);
  return sendSuccess(res, result, 'Vessels retrieved successfully');
});

const getVesselById = asyncHandler(async (req, res) => {
  const result = await vesselService.getVesselById(req.params.id);
  return sendSuccess(res, result, 'Vessel retrieved successfully');
});

const updateVessel = asyncHandler(async (req, res) => {
  const result = await vesselService.updateVessel(req.params.id, req.body);
  return sendSuccess(res, result, 'Vessel updated successfully');
});

const getVesselAvailability = asyncHandler(async (req, res) => {
  const result = await vesselService.getVesselAvailability(req.params.id);
  return sendSuccess(res, result, 'Vessel availability retrieved successfully');
});

module.exports = {
  createVessel,
  listVessels,
  getVesselById,
  updateVessel,
  getVesselAvailability,
};
