/**
 * Daily-search worker entrypoint.
 *
 * Run on a schedule (cron, GitHub Actions, a queue, or the middleware's built-in
 * scheduler). For every active wish it searches all stores, computes landed
 * cost, and proposes a purchase when the price is right.
 *
 *   npm run job:daily-search        # from repo root
 */
import { createBackend, loadDotEnv } from '../index.js';

async function main(): Promise<void> {
  loadDotEnv();
  const backend = await createBackend();
  const started = Date.now();
  const results = await backend.search.runDaily();

  const proposed = results.filter((r) => r.proposedDecisionId).length;
  const offers = results.reduce((sum, r) => sum + r.run.offersFound, 0);
  console.log(
    `[daily-search] ${results.length} wish(es) searched, ${offers} offer(s) captured, ` +
      `${proposed} purchase proposal(s) raised in ${Date.now() - started}ms.`,
  );
}

main().catch((err) => {
  console.error('[daily-search] fatal:', err);
  process.exit(1);
});
