const Joi = require('joi');

const { ROLE_VALUES } = require('../utils/roles');

const registerSchema = Joi.object({

  name: Joi.string().trim().min(2).max(100).required(),

  email: Joi.string().trim().lowercase().email().required(),

  password: Joi.string().min(8).max(128).required(),

  role: Joi.string()
    .valid(...ROLE_VALUES)
    .default('VIEWER'),

});

const loginSchema = Joi.object({

  email: Joi.string().trim().lowercase().email().required(),

  password: Joi.string().required(),

});

const uuidParamSchema = Joi.object({

  id: Joi.string().uuid().required(),

});

const cargoRequestIdParamSchema = Joi.object({

  cargoRequestId: Joi.string().uuid().required(),

});

module.exports = {

  registerSchema,
  loginSchema,
  uuidParamSchema,
  cargoRequestIdParamSchema,

};