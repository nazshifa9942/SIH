const contractService = require('../services/contract/contract.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const compareContracts = asyncHandler(async (req, res) => {
    const result = await contractService.compareContracts(req.user, req.body);
    return sendSuccess(res, result, 'Contract strategy comparison completed successfully');
});

const getContractComparison = asyncHandler(async (req, res) => {
    const result = await contractService.getContractComparison(req.user, {
        cargoRequestId: req.params.cargoRequestId,
    });
    return sendSuccess(res, result, 'Contract strategy comparison retrieved successfully');
});

module.exports = {
    compareContracts,
    getContractComparison,
};