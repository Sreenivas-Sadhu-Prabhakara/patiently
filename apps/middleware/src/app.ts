import fastifyCors from '@fastify/cors';
import type { Backend } from '@patiently/backend';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerAuth } from './auth.js';
import { corsOrigins, type MiddlewareConfig } from './config.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { authRoutes } from './routes/auth.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';
import { notificationRoutes } from './routes/notifications.routes.js';
import { wishRoutes } from './routes/wishes.routes.js';

/**
 * Build the configured Fastify app: CORS, JWT auth, a unified error handler and
 * all route groups. Kept separate from the server bootstrap so it can be
 * imported directly in integration tests (inject) without binding a port.
 */
export async function buildApp(
  backend: Backend,
  config: MiddlewareConfig,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(fastifyCors, { origin: corsOrigins(config), credentials: true });
  await registerAuth(app, config);
  registerErrorHandler(app);

  await healthRoutes(app);
  await authRoutes(app, backend);
  await wishRoutes(app, backend);
  await notificationRoutes(app, backend);
  await jobRoutes(app, backend, config);

  return app;
}
