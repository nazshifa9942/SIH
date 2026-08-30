jest.mock('../../src/config/database', () => require('../mocks/database'));

const { requireRole } = require('../../src/middleware/auth.middleware');
const { ROLES } = require('../../src/utils/roles');

function mockRes() {
  return {};
}

describe('requireRole', () => {
  it('allows an authorized role', () => {
    const req = { user: { id: '1', role: ROLES.ADMIN } };
    const next = jest.fn();

    requireRole(ROLES.ADMIN)(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an unauthorized role', () => {
    const req = { user: { id: '1', role: ROLES.VIEWER } };
    const next = jest.fn();

    requireRole(ROLES.ADMIN)(req, mockRes(), next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});
