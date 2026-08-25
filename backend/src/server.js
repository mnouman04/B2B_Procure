import { createApp } from './app.js';
import { env } from './config/env.js';
import { database } from './config/database.js';
import { logger } from './config/logger.js';
import { registerEventListeners } from './events/listeners.js';

const bootstrap = async () => {
  await database.connect();
  registerEventListeners();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`PROCURIO API listening on http://localhost:${env.port}${env.apiPrefix}`);
    logger.info(`Environment: ${env.nodeEnv} · CORS origin: ${env.clientUrl}`);
  });

  const shutdown = async (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await database.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  logger.error('Failed to start the API:', err);
  process.exit(1);
});
