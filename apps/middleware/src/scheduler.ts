import type { Backend } from '@patiently/backend';
import type { FastifyBaseLogger } from 'fastify';
import type { MiddlewareConfig } from './config.js';

/**
 * Optional in-process scheduler for the daily search — convenient for local
 * demos. In production prefer an external cron hitting POST /api/jobs/daily-search
 * so search work scales independently of the API. Returns a stop function.
 */
export function startScheduler(
  backend: Backend,
  config: MiddlewareConfig,
  log: FastifyBaseLogger,
): () => void {
  if (!config.ENABLE_SCHEDULER) return () => {};

  const intervalMs = config.SCHEDULER_INTERVAL_MINUTES * 60_000;
  log.info(
    `[scheduler] daily-search enabled, every ${config.SCHEDULER_INTERVAL_MINUTES} minute(s)`,
  );

  const timer = setInterval(() => {
    backend.search
      .runDaily()
      .then((results) => log.info(`[scheduler] searched ${results.length} wish(es)`))
      .catch((err) => log.error({ err }, '[scheduler] daily-search failed'));
  }, intervalMs);
  timer.unref();

  return () => clearInterval(timer);
}
