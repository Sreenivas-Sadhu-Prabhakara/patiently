import type { Backend } from '@patiently/backend';
import type { FastifyInstance } from 'fastify';
import type { MiddlewareConfig } from '../config.js';

/**
 * Trigger the daily-search worker over HTTP. Protected by a shared token rather
 * than a user JWT, so an external scheduler (cron, GitHub Actions, a queue) can
 * call it:  POST /api/jobs/daily-search  with header  x-job-token: <token>.
 */
export async function jobRoutes(
  app: FastifyInstance,
  backend: Backend,
  config: MiddlewareConfig,
): Promise<void> {
  app.post('/api/jobs/daily-search', async (req, reply) => {
    if (req.headers['x-job-token'] !== config.JOB_TRIGGER_TOKEN) {
      return reply.code(401).send({ error: 'Invalid job token' });
    }
    const results = await backend.search.runDaily();
    return {
      wishesSearched: results.length,
      offersCaptured: results.reduce((sum, r) => sum + r.run.offersFound, 0),
      proposalsRaised: results.filter((r) => r.proposedDecisionId).length,
    };
  });
}
