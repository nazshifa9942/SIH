const authService = require('../services/auth/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, result, 'Registration successful', 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, result, 'Login successful');
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getProfile(req.user.id);
  return sendSuccess(res, result, 'Current user');
});

module.exports = {
  register,
  login,
  me,
};
