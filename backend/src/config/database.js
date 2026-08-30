const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

async function connectDatabase() {
  await prisma.$connect();
  logger.info('PostgreSQL connected');
}

async function disconnectDatabase() {
  await prisma.$disconnect();
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (err) {
    logger.warn('PostgreSQL health check failed');
    return 'disconnected';
  }
}

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabase,
};
