const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const { sendError } = require('../utils/apiResponse');
const env = require('../config/env');

function notFoundHandler(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.isOperational) {
    return sendError(res, err.statusCode, err.code, err.message, err.details || []);
  }

  logger.error('Unhandled error', { message: err.message });

  const message = env.isProduction ? 'Internal server error' : err.message;
  return sendError(res, 500, 'INTERNAL_ERROR', message);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
