import { createBackend, loadDotEnv } from '@patiently/backend';
import { buildApp } from './app.js';
import { loadMiddlewareConfig } from './config.js';
import { startScheduler } from './scheduler.js';

async function main(): Promise<void> {
  loadDotEnv();
  const config = loadMiddlewareConfig();
  const backend = await createBackend();
  const app = await buildApp(backend, config);

  const stopScheduler = startScheduler(backend, config, app.log);

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`[middleware] ${signal} received, shutting down`);
    stopScheduler();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.MIDDLEWARE_PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error('[middleware] fatal:', err);
  process.exit(1);
});
