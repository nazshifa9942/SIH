const AppError = require('../utils/AppError');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((item) => ({
        field: item.path.join('.'),
        message: item.message,
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid request', details));
    }

    req[property] = value;
    return next();
  };
}

module.exports = validate;
