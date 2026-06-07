import type { Offer, Wish } from '@patiently/shared';

/**
 * The frugality engine — the product's core logic. Given the offers captured for
 * a wish on a given day, it:
 *   1. filters out anything the user can't/won't buy (condition, store, stock),
 *   2. ranks the rest by TRUE landed cost (price + shipping + tax − discounts),
 *   3. decides whether today's best price is good enough to ask the user to buy.
 *
 * It is intentionally pure (no IO, no clock except an injected `now`) so it can
 * be exhaustively unit-tested and reused unchanged on a mobile client.
 */

/** Buy when the deadline is within this many days, even without a budget hit. */
export const DEADLINE_BUFFER_DAYS = 7;
/** Treat a price this far below the day's median as an unmissable flash deal. */
export const FLASH_DEAL_FACTOR = 0.85;
/** Relative trust used only as a final tie-breaker between equal landed costs. */
const STORE_TRUST: Record<string, number> = {
  amazon_in: 5,
  flipkart: 4,
  croma: 3,
  reliance_digital: 3,
  tata_cliq: 2,
  myntra: 1,
};

export interface RankSummary {
  ranked: Offer[];
  best: Offer | null;
  medianLandedCents: number | null;
  savingsVsMedianCents: number | null;
}

export interface ProposalDecision {
  propose: boolean;
  reason: string;
}

/** Keep only offers the user is actually willing and able to purchase. */
export function eligibleOffers(offers: Offer[], wish: Wish): Offer[] {
  const allowed = new Set(wish.allowedStores);
  return offers.filter((o) => {
    if (!o.inStock) return false;
    if (allowed.size > 0 && !allowed.has(o.store)) return false;
    if (wish.condition !== 'any' && o.condition !== wish.condition) return false;
    return true;
  });
}

/** Rank eligible offers cheapest-landed first, with sensible tie-breakers. */
export function rankOffers(offers: Offer[], wish: Wish): Offer[] {
  return [...eligibleOffers(offers, wish)].sort((a, b) => {
    if (a.totalLandedCents !== b.totalLandedCents) {
      return a.totalLandedCents - b.totalLandedCents;
    }
    const deliveryA = a.estDeliveryDays ?? 99;
    const deliveryB = b.estDeliveryDays ?? 99;
    if (deliveryA !== deliveryB) return deliveryA - deliveryB;
    if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
    return (STORE_TRUST[b.store] ?? 0) - (STORE_TRUST[a.store] ?? 0);
  });
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2) : sorted[mid]!;
}

/** Produce the ranked list plus the best offer and savings-vs-median metric. */
export function summarize(offers: Offer[], wish: Wish): RankSummary {
  const ranked = rankOffers(offers, wish);
  const best = ranked[0] ?? null;
  const medianLandedCents = median(ranked.map((o) => o.totalLandedCents));
  const savingsVsMedianCents =
    best && medianLandedCents !== null ? medianLandedCents - best.totalLandedCents : null;
  return { ranked, best, medianLandedCents, savingsVsMedianCents };
}

function daysUntil(iso: string, now: Date): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}

/**
 * Decide whether to surface today's best offer to the user for one-tap approval.
 * Human-in-the-loop: we never buy autonomously — we propose, the user approves.
 *
 * Triggers (in priority order):
 *   • budget hit      — best landed cost is at or below the user's target
 *   • flash deal      — best is well below today's median across stores
 *   • deadline        — the desired-by date is imminent; lock in the best price
 */
export function evaluateProposal(summary: RankSummary, wish: Wish, now: Date): ProposalDecision {
  const { best, medianLandedCents } = summary;
  if (!best) return { propose: false, reason: 'No eligible in-stock offers yet.' };

  const daysLeft = daysUntil(wish.desiredByDate, now);

  if (wish.maxBudgetCents !== undefined && best.totalLandedCents <= wish.maxBudgetCents) {
    return {
      propose: true,
      reason: `Landed cost is at or under your budget (${best.store}).`,
    };
  }

  if (
    medianLandedCents !== null &&
    best.totalLandedCents <= Math.round(medianLandedCents * FLASH_DEAL_FACTOR) &&
    (wish.maxBudgetCents === undefined || best.totalLandedCents <= wish.maxBudgetCents)
  ) {
    return { propose: true, reason: `Unusually low price right now (${best.store}).` };
  }

  if (daysLeft <= DEADLINE_BUFFER_DAYS) {
    const overBudget =
      wish.maxBudgetCents !== undefined && best.totalLandedCents > wish.maxBudgetCents;
    return {
      propose: true,
      reason: overBudgetReason(overBudget, daysLeft, best.store),
    };
  }

  return { propose: false, reason: 'Still hunting for a better price.' };
}

function overBudgetReason(overBudget: boolean, daysLeft: number, store: string): string {
  const when = daysLeft <= 0 ? 'today' : `in ${daysLeft} day(s)`;
  return overBudget
    ? `Deadline is ${when} and the best price is above budget — your call (${store}).`
    : `Deadline is ${when}; locking in the best available price (${store}).`;
}
