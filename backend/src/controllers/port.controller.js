const portService = require('../services/port/port.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const createPort = asyncHandler(async (req, res) => {
    const result = await portService.createPort(req.body);
    return sendSuccess(res, result, 'Port created successfully', 201);
});

const listPorts = asyncHandler(async (req, res) => {
    const result = await portService.listPorts(req.query);
    return sendSuccess(res, result, 'Ports retrieved successfully');
});

const getPortById = asyncHandler(async (req, res) => {
    const result = await portService.getPortById(req.params.id);
    return sendSuccess(res, result, 'Port retrieved successfully');
});

const updatePort = asyncHandler(async (req, res) => {
    const result = await portService.updatePort(req.params.id, req.body);
    return sendSuccess(res, result, 'Port updated successfully');
});

module.exports = {
    createPort,
    listPorts,
    getPortById,
    updatePort,
};
