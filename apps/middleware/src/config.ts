import { z } from 'zod';

const Schema = z.object({
  MIDDLEWARE_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('dev-only-change-me'),
  ENABLE_SCHEDULER: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  SCHEDULER_INTERVAL_MINUTES: z.coerce.number().int().positive().default(1440),
  JOB_TRIGGER_TOKEN: z.string().default('dev-only-job-token'),
});

export type MiddlewareConfig = z.infer<typeof Schema>;

export function loadMiddlewareConfig(env: NodeJS.ProcessEnv = process.env): MiddlewareConfig {
  return Schema.parse(env);
}

/** Parse the comma-separated CORS origins into an array. */
export function corsOrigins(config: MiddlewareConfig): string[] {
  return config.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
