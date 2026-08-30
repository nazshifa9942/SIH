const createApp = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/database');

const app = createApp();

async function start() {
  await connectDatabase();
  const server = app.listen(env.port, () => {
    logger.info(`SIH26006 backend listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('Failed to start server', { message: err.message });
  process.exit(1);
});
