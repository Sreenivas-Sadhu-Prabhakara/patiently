/**
 * Seed demo data so the app is explorable immediately:
 *   • a few demo users, each with a couple of ₹ wishes,
 *   • one daily-search pass so offers (and maybe proposals) already exist.
 *
 *   npm run seed        # from repo root
 *
 * Idempotent: a user that already has wishes is left untouched.
 */
import { createBackend, loadDotEnv } from '../index.js';
import { CreateWishInput, toCents } from '@patiently/shared';

function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

interface SeedWish {
  title: string;
  brand?: string;
  model?: string;
  category?: string;
  keywords?: string[];
  months: number;
  budget: number; // rupees
  condition?: CreateWishInput['condition'];
}

interface SeedUser {
  email: string;
  name: string;
  wishes: SeedWish[];
}

const USERS: SeedUser[] = [
  {
    email: 'demo@patiently.app',
    name: 'Demo User',
    wishes: [
      {
        title: 'Sony WH-1000XM5 wireless headphones',
        brand: 'Sony',
        model: 'WH-1000XM5',
        category: 'electronics',
        keywords: ['sony', 'wh-1000xm5', 'noise cancelling headphones'],
        months: 4,
        budget: 26990,
        condition: 'new',
      },
      {
        title: 'Samsung 55-inch Crystal 4K Smart TV',
        brand: 'Samsung',
        category: 'electronics',
        keywords: ['samsung', '55 inch', '4k', 'smart tv'],
        months: 6,
        budget: 90000,
        condition: 'any',
      },
    ],
  },
  {
    email: 'aarav@patiently.app',
    name: 'Aarav Sharma',
    wishes: [
      {
        title: 'Apple iPhone 15 128GB',
        brand: 'Apple',
        category: 'electronics',
        keywords: ['apple', 'iphone 15'],
        months: 5,
        budget: 70000,
        condition: 'new',
      },
      {
        title: 'Nike Pegasus 41 running shoes',
        brand: 'Nike',
        category: 'footwear',
        keywords: ['nike', 'pegasus', 'running shoes'],
        months: 3,
        budget: 11000,
        condition: 'any',
      },
    ],
  },
  {
    email: 'diya@patiently.app',
    name: 'Diya Nair',
    wishes: [
      {
        title: 'Dyson V12 Detect Slim cordless vacuum',
        brand: 'Dyson',
        category: 'home',
        keywords: ['dyson', 'v12', 'cordless vacuum'],
        months: 6,
        budget: 55000,
        condition: 'any',
      },
      {
        title: 'Instant Pot Duo 6L electric pressure cooker',
        brand: 'Instant Pot',
        category: 'kitchen',
        keywords: ['instant pot', 'duo', 'pressure cooker'],
        months: 4,
        budget: 9000,
        condition: 'any',
      },
    ],
  },
];

async function main(): Promise<void> {
  loadDotEnv();
  const backend = await createBackend();

  let created = 0;
  for (const seed of USERS) {
    const user = await backend.users.loginOrCreate({ email: seed.email, name: seed.name });
    const existing = await backend.wishes.listWishes(user.id);
    if (existing.length > 0) continue;
    for (const w of seed.wishes) {
      await backend.wishes.createWish(user.id, {
        title: w.title,
        ...(w.brand ? { brand: w.brand } : {}),
        ...(w.model ? { model: w.model } : {}),
        category: w.category ?? 'general',
        keywords: w.keywords ?? [],
        desiredByDate: monthsFromNow(w.months),
        maxBudgetCents: toCents(w.budget),
        condition: w.condition ?? 'new',
      });
    }
    created += 1;
  }

  const results = await backend.search.runDaily();
  console.log(
    `[seed] ${USERS.length} user(s) ensured (${created} newly seeded); ` +
      `ran search over ${results.length} active wish(es).`,
  );
  console.log(`[seed] log in as: ${USERS.map((u) => u.email).join(', ')}`);
}

main().catch((err) => {
  console.error('[seed] fatal:', err);
  process.exit(1);
});
