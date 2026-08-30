const ROLES = Object.freeze({
  PROCUREMENT_MANAGER: 'PROCUREMENT_MANAGER',
  LOGISTICS_MANAGER: 'LOGISTICS_MANAGER',
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER',
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_VALUES,
};
