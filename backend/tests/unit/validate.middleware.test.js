const validate = require('../../src/middleware/validate.middleware');
const { uuidParamSchema, registerSchema } = require('../../src/validators/auth.validator');

function run(schema, property, value) {
  const req = { [property]: value };
  const next = jest.fn();
  validate(schema, property)(req, {}, next);
  return { req, next };
}

describe('validate middleware', () => {
  it('rejects invalid UUIDs', () => {
    const { next } = run(uuidParamSchema, 'params', { id: 'not-a-uuid' });
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('accepts a valid UUID', () => {
    const { next, req } = run(uuidParamSchema, 'params', {
      id: '11111111-1111-4111-8111-111111111111',
    });
    expect(next).toHaveBeenCalledWith();
    expect(req.params.id).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('rejects an invalid email on register', () => {
    const { next } = run(registerSchema, 'body', {
      name: 'Nitin Kumar',
      email: 'bad',
      password: 'securePass1',
    });
    const err = next.mock.calls[0][0];
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});
