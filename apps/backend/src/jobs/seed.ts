/**
 * Seed demo data so the app is explorable immediately:
 *   • a demo user (demo@patiently.app),
 *   • two wishes with realistic 3–6 month horizons,
 *   • one daily-search pass so offers and (maybe) a proposal already exist.
 *
 *   npm run seed        # from repo root
 */
import { createBackend, loadDotEnv } from '../index.js';
import { toCents } from '@patiently/shared';

function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

async function main(): Promise<void> {
  loadDotEnv();
  const backend = await createBackend();

  const user = await backend.users.loginOrCreate({
    email: 'demo@patiently.app',
    name: 'Demo User',
  });

  const existing = await backend.wishes.listWishes(user.id);
  if (existing.length === 0) {
    await backend.wishes.createWish(user.id, {
      title: 'Sony WH-1000XM5 wireless headphones',
      description: 'Noise-cancelling over-ear headphones for travel.',
      keywords: ['sony', 'wh-1000xm5', 'noise cancelling headphones'],
      category: 'electronics',
      brand: 'Sony',
      model: 'WH-1000XM5',
      desiredByDate: monthsFromNow(4),
      maxBudgetCents: toCents(26990), // ₹26,990
      condition: 'new',
    });

    await backend.wishes.createWish(user.id, {
      title: 'Samsung 55-inch Crystal 4K Smart TV',
      description:
        'Happy to wait for a festive-season deal (Big Billion Days / Great Indian Festival).',
      keywords: ['samsung', '55 inch', '4k', 'smart tv', 'crystal uhd'],
      category: 'electronics',
      brand: 'Samsung',
      desiredByDate: monthsFromNow(6),
      maxBudgetCents: toCents(90000), // ₹90,000
      condition: 'any',
    });
    console.log('[seed] created demo user and 2 wishes (₹ budgets, India stores).');
  } else {
    console.log('[seed] demo user already has wishes; skipping wish creation.');
  }

  const results = await backend.search.runDaily();
  console.log(`[seed] ran initial search over ${results.length} wish(es).`);
  console.log(`[seed] done. Log in as demo@patiently.app to explore.`);
}

main().catch((err) => {
  console.error('[seed] fatal:', err);
  process.exit(1);
});
