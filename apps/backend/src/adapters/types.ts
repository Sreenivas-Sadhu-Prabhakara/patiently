import type { ItemCondition, StoreId } from '@patiently/shared';

/** What the search service hands an adapter for one wish. */
export interface SearchQuery {
  text: string;
  keywords: string[];
  brand?: string;
  model?: string;
  condition: ItemCondition;
  currency: string;
  destinationCountry: string;
  destinationPostal: string;
  /** Don't bother returning offers above this landed budget, if set (cents). */
  maxBudgetCents?: number;
}

/**
 * A raw price observation from a store, BEFORE Patiently computes landed cost.
 * Adapters return item price + (when known) shipping/tax; the landed-cost engine
 * fills in estimates for whatever a store doesn't provide.
 */
export interface RawOffer {
  externalId: string;
  title: string;
  url: string;
  imageUrl?: string;
  condition: ItemCondition;
  currency: string;
  itemPriceCents: number;
  /** Known shipping cost in cents, or undefined to let the engine estimate it. */
  shippingCents?: number;
  /** Known tax in cents, or undefined to let the engine estimate it. */
  taxCents?: number;
  discountCents?: number;
  inStock: boolean;
  rating?: number;
  estDeliveryDays?: number;
}

/**
 * A pluggable e-commerce store. Real adapters (Amazon/eBay/BestBuy) implement
 * `search` against live APIs and report `isConfigured()` based on env keys; the
 * registry substitutes the mock feed for any store that isn't configured, so the
 * product runs end-to-end today and upgrades to live data key-by-key.
 */
export interface StoreAdapter {
  readonly id: StoreId;
  readonly name: string;
  /** True when the required API credentials are present. */
  isConfigured(): boolean;
  /** Whether this adapter hits a live API (false = mock feed). */
  readonly isLive: boolean;
  search(query: SearchQuery): Promise<RawOffer[]>;
}
