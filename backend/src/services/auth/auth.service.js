const { prisma } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const logger = require('../../config/logger');
const { ROLES } = require('../../utils/roles');

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function register({ name, email, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Email is already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || ROLES.VIEWER,
    },
  });

  logger.info('User registered', { userId: user.id, role: user.role });

  const token = signToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  logger.info('User logged in', { userId: user.id });

  const token = signToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not found');
  }
  return { user: toPublicUser(user) };
}

module.exports = {
  register,
  login,
  getProfile,
  toPublicUser,
};
