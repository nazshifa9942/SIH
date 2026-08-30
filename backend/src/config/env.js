const Joi = require('joi');
const dotenv = require('dotenv');
const path = require('path');

if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().min(1).required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  LOG_LEVEL: Joi.string().default('info'),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, { abortEarly: false });

if (error) {
  const details = error.details.map((d) => d.message).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

module.exports = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  databaseUrl: value.DATABASE_URL,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  corsOrigin: value.CORS_ORIGIN,
  logLevel: value.LOG_LEVEL,
  isProduction: value.NODE_ENV === 'production',
  isTest: value.NODE_ENV === 'test',
};
