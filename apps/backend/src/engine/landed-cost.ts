import type { BackendConfig } from '../config/env.js';
import type { RawOffer } from '../adapters/types.js';

/** Shipping/tax/landed-cost breakdown computed for a raw offer. */
export interface LandedCost {
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalLandedCents: number;
}

/** Heuristic (India): free over ₹500, else a flat ₹49, when a store omits shipping. */
const FREE_SHIPPING_THRESHOLD_PAISE = 50_000; // ₹500
const ESTIMATED_FLAT_SHIPPING_PAISE = 4_900; // ₹49

/**
 * Turn a store's raw price observation into a true "cost to my doorstep".
 * Whatever the store doesn't tell us (shipping, tax) we estimate consistently
 * across stores, so the comparison is apples-to-apples. This is the number the
 * frugality engine optimises — not the sticker price.
 *
 * In India, listed prices already include GST, so `DEFAULT_TAX_RATE` is 0 by
 * default and tax adds nothing — but the term stays configurable for any store
 * (or destination) that quotes ex-tax prices.
 */
export function computeLandedCost(raw: RawOffer, config: BackendConfig): LandedCost {
  const shippingCents =
    raw.shippingCents ??
    (raw.itemPriceCents >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : ESTIMATED_FLAT_SHIPPING_PAISE);

  const taxCents = raw.taxCents ?? Math.round(raw.itemPriceCents * config.DEFAULT_TAX_RATE);

  const discountCents = raw.discountCents ?? 0;

  const totalLandedCents = Math.max(
    0,
    raw.itemPriceCents + shippingCents + taxCents - discountCents,
  );

  return { shippingCents, taxCents, discountCents, totalLandedCents };
}
