const winston = require('winston');

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sih26006-backend' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

function sanitizeLogMeta(meta) {
  if (!meta || typeof meta !== 'object') {
    return meta;
  }

  const blocked = ['password', 'passwordHash', 'token', 'authorization', 'jwt', 'secret'];
  const copy = { ...meta };

  for (const key of Object.keys(copy)) {
    if (blocked.includes(key.toLowerCase())) {
      copy[key] = '[redacted]';
    }
  }

  return copy;
}

module.exports = {
  info: (message, meta) => logger.info(message, sanitizeLogMeta(meta)),
  warn: (message, meta) => logger.warn(message, sanitizeLogMeta(meta)),
  error: (message, meta) => logger.error(message, sanitizeLogMeta(meta)),
  debug: (message, meta) => logger.debug(message, sanitizeLogMeta(meta)),
};
