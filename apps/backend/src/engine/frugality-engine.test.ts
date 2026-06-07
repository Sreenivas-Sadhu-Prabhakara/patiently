import { describe, expect, it } from 'vitest';
import type { Offer, Wish } from '@patiently/shared';
import { evaluateProposal, rankOffers, summarize } from './frugality-engine.js';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeWish(overrides: Partial<Wish> = {}): Wish {
  return {
    id: 'w1',
    userId: 'u1',
    title: 'Sony WH-1000XM5 headphones',
    description: '',
    keywords: ['sony', 'wh-1000xm5'],
    category: 'electronics',
    desiredByDate: '2026-06-01T00:00:00.000Z',
    condition: 'new',
    currency: 'INR',
    allowedStores: [],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

let offerSeq = 0;
function makeOffer(overrides: Partial<Offer> = {}): Offer {
  offerSeq += 1;
  const itemPriceCents = overrides.itemPriceCents ?? 30000;
  return {
    id: `o${offerSeq}`,
    wishId: 'w1',
    store: 'amazon_in',
    externalId: `ext${offerSeq}`,
    title: 'Sony WH-1000XM5',
    url: 'https://example.test/item',
    condition: 'new',
    currency: 'INR',
    itemPriceCents,
    shippingCents: 0,
    taxCents: 0,
    discountCents: 0,
    totalLandedCents: overrides.totalLandedCents ?? itemPriceCents,
    inStock: true,
    capturedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('rankOffers', () => {
  it('ranks by total landed cost, not sticker price', () => {
    const cheapItemDearShipping = makeOffer({
      store: 'flipkart',
      itemPriceCents: 25000,
      totalLandedCents: 31000,
    });
    const dearItemFreeShipping = makeOffer({
      store: 'amazon_in',
      itemPriceCents: 28000,
      totalLandedCents: 28000,
    });
    const ranked = rankOffers([cheapItemDearShipping, dearItemFreeShipping], makeWish());
    expect(ranked[0]?.store).toBe('amazon_in');
  });

  it('filters out-of-stock, wrong-condition, and disallowed stores', () => {
    const wish = makeWish({ condition: 'new', allowedStores: ['amazon_in', 'croma'] });
    const offers = [
      makeOffer({ store: 'amazon_in', inStock: false }),
      makeOffer({ store: 'flipkart', condition: 'new' }), // disallowed store
      makeOffer({ store: 'amazon_in', condition: 'used' }), // wrong condition
      makeOffer({ store: 'croma', condition: 'new', totalLandedCents: 29000 }),
    ];
    const ranked = rankOffers(offers, wish);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.store).toBe('croma');
  });

  it('breaks landed-cost ties by faster delivery', () => {
    const slow = makeOffer({ store: 'flipkart', totalLandedCents: 30000, estDeliveryDays: 7 });
    const fast = makeOffer({
      store: 'reliance_digital',
      totalLandedCents: 30000,
      estDeliveryDays: 2,
    });
    const ranked = rankOffers([slow, fast], makeWish());
    expect(ranked[0]?.store).toBe('reliance_digital');
  });
});

describe('summarize', () => {
  it('reports savings versus the median landed cost', () => {
    const offers = [
      makeOffer({ totalLandedCents: 20000 }),
      makeOffer({ totalLandedCents: 30000 }),
      makeOffer({ totalLandedCents: 40000 }),
    ];
    const summary = summarize(offers, makeWish());
    expect(summary.best?.totalLandedCents).toBe(20000);
    expect(summary.medianLandedCents).toBe(30000);
    expect(summary.savingsVsMedianCents).toBe(10000);
  });
});

describe('evaluateProposal', () => {
  it('proposes when landed cost is at or under budget', () => {
    const wish = makeWish({ maxBudgetCents: 30000 });
    const summary = summarize([makeOffer({ totalLandedCents: 29900 })], wish);
    const decision = evaluateProposal(summary, wish, NOW);
    expect(decision.propose).toBe(true);
    expect(decision.reason).toMatch(/budget/i);
  });

  it('proposes a flash deal far below the daily median', () => {
    const wish = makeWish(); // no budget
    const offers = [
      makeOffer({ totalLandedCents: 20000 }), // best, < 85% of median (30000)
      makeOffer({ totalLandedCents: 30000 }),
      makeOffer({ totalLandedCents: 31000 }),
    ];
    const decision = evaluateProposal(summarize(offers, wish), wish, NOW);
    expect(decision.propose).toBe(true);
    expect(decision.reason).toMatch(/low price/i);
  });

  it('proposes near the deadline even without a budget hit', () => {
    const wish = makeWish({ desiredByDate: '2026-01-05T00:00:00.000Z' }); // 4 days out
    const offers = [makeOffer({ totalLandedCents: 50000 }), makeOffer({ totalLandedCents: 51000 })];
    const decision = evaluateProposal(summarize(offers, wish), wish, NOW);
    expect(decision.propose).toBe(true);
    expect(decision.reason).toMatch(/deadline/i);
  });

  it('keeps hunting when no trigger is met', () => {
    const wish = makeWish({ maxBudgetCents: 10000 }); // far below market
    const offers = [makeOffer({ totalLandedCents: 30000 }), makeOffer({ totalLandedCents: 31000 })];
    const decision = evaluateProposal(summarize(offers, wish), wish, NOW);
    expect(decision.propose).toBe(false);
  });

  it('does not propose when there are no eligible offers', () => {
    const wish = makeWish();
    const decision = evaluateProposal(summarize([makeOffer({ inStock: false })], wish), wish, NOW);
    expect(decision.propose).toBe(false);
  });
});
