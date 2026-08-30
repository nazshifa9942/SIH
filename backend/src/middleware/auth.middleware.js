const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const { prisma } = require('../config/database');

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token expired');
    }
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
  }

  req.user = user;
  next();
});

function requireRole(...allowedRoles) {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
