const cargoService = require('../services/cargo/cargo.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const createCargo = asyncHandler(async (req, res) => {
    // Use caller's authenticated user ID
    const result = await cargoService.createCargo(req.user.id, req.body);
    return sendSuccess(res, result, 'Cargo request created successfully', 201);
});

const listCargo = asyncHandler(async (req, res) => {
    const result = await cargoService.listCargo(req.user, req.query);
    return sendSuccess(res, result, 'Cargo requests retrieved successfully');
});

const getCargoById = asyncHandler(async (req, res) => {
    const result = await cargoService.getCargoById(req.params.id, req.user);
    return sendSuccess(res, result, 'Cargo request retrieved successfully');
});

const updateCargo = asyncHandler(async (req, res) => {
    const result = await cargoService.updateCargo(req.params.id, req.user, req.body);
    return sendSuccess(res, result, 'Cargo request updated successfully');
});

const deleteCargo = asyncHandler(async (req, res) => {
    const result = await cargoService.deleteCargo(req.params.id, req.user);
    return sendSuccess(res, result, 'Cargo request deleted successfully');
});

module.exports = {
    createCargo,
    listCargo,
    getCargoById,
    updateCargo,
    deleteCargo,
};
