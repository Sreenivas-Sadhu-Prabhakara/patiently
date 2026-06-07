import type { ItemCondition, StoreId } from '@patiently/shared';
import type { RawOffer, SearchQuery, StoreAdapter } from './types.js';

/** Deterministic string hash (FNV-1a) → 32-bit unsigned int. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Tiny seeded PRNG (mulberry32) so a given (store, query, day) is reproducible. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MockStoreProfile {
  /** Multiplier applied to the item's base price (store positioning). */
  priceFactor: number;
  freeShippingOverCents: number;
  flatShippingCents: number;
  /** Probability this store lists the item as used/refurbished. */
  usedBias: number;
  baseDeliveryDays: number;
  ratingFloor: number;
}

// Profiles for India storefronts. Amounts are in paise (₹1 = 100 paise).
const PROFILES: Record<StoreId, MockStoreProfile> = {
  amazon_in: {
    priceFactor: 1.0,
    freeShippingOverCents: 50_000, // free over ₹500
    flatShippingCents: 4_000, // ₹40
    usedBias: 0.04,
    baseDeliveryDays: 2,
    ratingFloor: 4.0,
  },
  flipkart: {
    priceFactor: 0.97,
    freeShippingOverCents: 50_000,
    flatShippingCents: 4_000,
    usedBias: 0.03,
    baseDeliveryDays: 3,
    ratingFloor: 3.9,
  },
  croma: {
    priceFactor: 1.04,
    freeShippingOverCents: 0, // electronics retailer, free delivery
    flatShippingCents: 0,
    usedBias: 0.02,
    baseDeliveryDays: 4,
    ratingFloor: 4.1,
  },
  reliance_digital: {
    priceFactor: 1.02,
    freeShippingOverCents: 0,
    flatShippingCents: 0,
    usedBias: 0.02,
    baseDeliveryDays: 4,
    ratingFloor: 4.0,
  },
  tata_cliq: {
    priceFactor: 1.05,
    freeShippingOverCents: 50_000,
    flatShippingCents: 4_900, // ₹49
    usedBias: 0.03,
    baseDeliveryDays: 5,
    ratingFloor: 3.8,
  },
  myntra: {
    priceFactor: 1.0,
    freeShippingOverCents: 79_900, // free over ₹799
    flatShippingCents: 9_900, // ₹99
    usedBias: 0.0,
    baseDeliveryDays: 5,
    ratingFloor: 3.9,
  },
};

/** Current day index (UTC) — makes mock prices drift day-to-day, like real ones. */
function dayIndex(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/**
 * A deterministic, dependency-free price feed used for any store that has no real
 * API credentials. Prices are derived from the query text (so different items
 * cost different amounts) and the calendar day (so they drift over the wish's
 * 3–6 month horizon), which lets the whole product be demoed without keys.
 */
export class MockAdapter implements StoreAdapter {
  readonly isLive = false;

  constructor(
    readonly id: StoreId,
    readonly name: string,
  ) {}

  isConfigured(): boolean {
    return true;
  }

  async search(query: SearchQuery): Promise<RawOffer[]> {
    const profile = PROFILES[this.id];
    const seedKey = `${this.id}|${query.text.toLowerCase().trim()}|${dayIndex()}`;
    const rand = rng(hash(seedKey));

    // Base price for the item (₹500–₹80,000 in paise), stable for a given item
    // across stores (seeded only by the query), then nudged by store + day.
    const itemSeed = hash(query.text.toLowerCase().trim());
    const itemBaseCents = 50_000 + (itemSeed % 7_950_000);

    const numOffers = 1 + Math.floor(rand() * 3); // 1–3 listings per store
    const offers: RawOffer[] = [];

    for (let i = 0; i < numOffers; i++) {
      const dayDrift = 0.92 + rand() * 0.16; // ±8% day-to-day movement
      const listingDrift = 0.97 + rand() * 0.08;
      const itemPriceCents = Math.round(
        itemBaseCents * profile.priceFactor * dayDrift * listingDrift,
      );

      const isUsed = rand() < profile.usedBias;
      const condition: ItemCondition = isUsed ? (rand() < 0.5 ? 'used' : 'refurbished') : 'new';

      // Respect the wish's condition filter at the source where possible.
      if (query.condition === 'new' && condition !== 'new') continue;

      const shippingCents =
        itemPriceCents >= profile.freeShippingOverCents ? 0 : profile.flatShippingCents;

      offers.push({
        externalId: `${this.id}-${(itemSeed % 1_000_000).toString(36)}-${i}`,
        title: this.titleFor(query, condition),
        url: `https://example.${this.id}.test/item/${itemSeed % 1_000_000}-${i}`,
        condition,
        currency: query.currency,
        itemPriceCents,
        shippingCents,
        discountCents: rand() < 0.25 ? Math.round(itemPriceCents * 0.05) : 0,
        inStock: rand() > 0.07,
        rating: Math.min(5, +(profile.ratingFloor + rand()).toFixed(1)),
        estDeliveryDays: profile.baseDeliveryDays + Math.floor(rand() * 4),
      });
    }

    // Guarantee at least one offer even if the condition filter removed all.
    if (offers.length === 0) {
      const itemPriceCents = Math.round(itemBaseCents * profile.priceFactor);
      offers.push({
        externalId: `${this.id}-${(itemSeed % 1_000_000).toString(36)}-x`,
        title: this.titleFor(query, 'new'),
        url: `https://example.${this.id}.test/item/${itemSeed % 1_000_000}-x`,
        condition: 'new',
        currency: query.currency,
        itemPriceCents,
        shippingCents:
          itemPriceCents >= profile.freeShippingOverCents ? 0 : profile.flatShippingCents,
        discountCents: 0,
        inStock: true,
        rating: +(profile.ratingFloor + 0.5).toFixed(1),
        estDeliveryDays: profile.baseDeliveryDays,
      });
    }

    return offers;
  }

  private titleFor(query: SearchQuery, condition: ItemCondition): string {
    const prefix =
      condition === 'new' ? '' : `${condition[0]!.toUpperCase()}${condition.slice(1)} `;
    const brand = query.brand ? `${query.brand} ` : '';
    return `${prefix}${brand}${query.text}`.trim();
  }
}
