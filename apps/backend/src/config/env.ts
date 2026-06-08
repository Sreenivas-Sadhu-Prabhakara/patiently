import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { z } from 'zod';

/**
 * Find the monorepo root (the dir whose package.json declares workspaces) by
 * walking up from `start`. Used to anchor relative paths so every tier resolves
 * the same data directory regardless of which workspace's cwd it runs from.
 */
function findRepoRoot(start: string = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg)) {
      try {
        const json = JSON.parse(readFileSync(pkg, 'utf8')) as { workspaces?: unknown };
        if (Array.isArray(json.workspaces)) return dir;
      } catch {
        /* ignore unreadable package.json and keep walking up */
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(start); // hit fs root; fall back to start
    dir = parent;
  }
}

/**
 * Load the repo-root `.env` into `process.env` if present. Safe to call from any
 * workspace cwd (it walks up to the monorepo root) and a no-op when no file
 * exists, so the app still boots on its defaults.
 */
export function loadDotEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '.env'),
    resolve(process.cwd(), '..', '..', '.env'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        process.loadEnvFile(path);
      } catch {
        /* ignore malformed env file; fall back to defaults */
      }
      return;
    }
  }
}

/**
 * Typed, validated backend configuration. Reads from `process.env` (the
 * middleware loads the root `.env` before importing the backend). Every value
 * has a default so the app boots with zero configuration.
 */
const EnvSchema = z.object({
  DATA_DIR: z.string().default('./data'),
  DEFAULT_CURRENCY: z.string().default('INR'),
  DEFAULT_DESTINATION_COUNTRY: z.string().default('IN'),
  DEFAULT_DESTINATION_POSTAL: z.string().default('560001'), // Bengaluru PIN
  // Indian marketplace prices are listed inclusive of GST, so by default we add
  // no extra tax to the landed cost. Override only if a store returns ex-GST.
  DEFAULT_TAX_RATE: z.coerce.number().min(0).max(1).default(0),

  // Amazon India Product Advertising API v5 (host/region differ from the US).
  AMAZON_ACCESS_KEY: z.string().optional(),
  AMAZON_SECRET_KEY: z.string().optional(),
  AMAZON_PARTNER_TAG: z.string().optional(),
  AMAZON_HOST: z.string().default('webservices.amazon.in'),
  AMAZON_REGION: z.string().default('eu-west-1'),
  AMAZON_MARKETPLACE: z.string().default('www.amazon.in'),

  // Flipkart Affiliate API.
  FLIPKART_AFFILIATE_ID: z.string().optional(),
  FLIPKART_AFFILIATE_TOKEN: z.string().optional(),

  // Firebase Cloud Messaging (push). Service-account fields; when unset, the
  // backend uses a log-only push sender so the flow is still demonstrable.
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Partner storefront APIs (Croma, Reliance Digital, Tata CLiQ, Myntra). These
  // retailers don't publish open product APIs, so each adapter is gated behind a
  // partner/affiliate base URL + API key you obtain from the retailer; when a
  // store's pair is unset, the registry uses its deterministic mock feed.
  CROMA_API_BASE: z.string().optional(),
  CROMA_API_KEY: z.string().optional(),
  RELIANCE_DIGITAL_API_BASE: z.string().optional(),
  RELIANCE_DIGITAL_API_KEY: z.string().optional(),
  TATA_CLIQ_API_BASE: z.string().optional(),
  TATA_CLIQ_API_KEY: z.string().optional(),
  MYNTRA_API_BASE: z.string().optional(),
  MYNTRA_API_KEY: z.string().optional(),
});

export type BackendConfig = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BackendConfig {
  const config = EnvSchema.parse(env);
  // Anchor a relative data dir to the repo root so all tiers share one store.
  if (!isAbsolute(config.DATA_DIR)) {
    config.DATA_DIR = resolve(findRepoRoot(), config.DATA_DIR);
  }
  return config;
}
