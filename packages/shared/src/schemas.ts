import { z } from 'zod';

/**
 * Single source of truth for the Patiently domain.
 *
 * Every entity and API payload is defined here as a Zod schema; the TypeScript
 * types are *derived* from the schemas (`z.infer`). Backend, middleware and
 * frontend all import from `@patiently/shared`, so a change to the contract is
 * a single edit that the whole stack type-checks against.
 *
 * Money is represented as an integer number of minor currency units ("cents")
 * to avoid floating-point rounding errors in price math. Use `formatMoney`.
 */

// ── Enumerations ─────────────────────────────────────────────────────────────

// India-market storefronts. Amazon.in and Flipkart have live API adapters;
// the rest use the mock feed until a real integration is added.
export const StoreId = z.enum([
  'amazon_in',
  'flipkart',
  'croma',
  'reliance_digital',
  'tata_cliq',
  'myntra',
]);
export type StoreId = z.infer<typeof StoreId>;

export const ItemCondition = z.enum(['new', 'used', 'refurbished', 'any']);
export type ItemCondition = z.infer<typeof ItemCondition>;

/**
 * Lifecycle of a wish:
 *  active            → being searched daily, no qualifying deal yet
 *  awaiting_approval → a deal met the user's criteria; one-tap approval pending
 *  purchasing        → approved; checkout in progress
 *  purchased         → order placed successfully
 *  cancelled         → user cancelled
 *  expired           → desired-by date passed without a purchase
 */
export const WishStatus = z.enum([
  'active',
  'awaiting_approval',
  'purchasing',
  'purchased',
  'cancelled',
  'expired',
]);
export type WishStatus = z.infer<typeof WishStatus>;

export const DecisionStatus = z.enum(['proposed', 'approved', 'rejected', 'placed', 'failed']);
export type DecisionStatus = z.infer<typeof DecisionStatus>;

export const NotificationType = z.enum([
  'deal_found',
  'approval_needed',
  'purchased',
  'purchase_failed',
  'expiring_soon',
]);
export type NotificationType = z.infer<typeof NotificationType>;

// ── Core entities ────────────────────────────────────────────────────────────

export const User = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof User>;

export const Wish = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(2).max(160),
  description: z.string().max(2000).default(''),
  /** Free-text search keywords the adapters query against. */
  keywords: z.array(z.string()).default([]),
  category: z.string().default('general'),
  /** Optional hard identifiers that make matching precise when known. */
  brand: z.string().optional(),
  model: z.string().optional(),
  /** ISO dates bracketing the 3–6 month acquisition window. */
  desiredByDate: z.string().datetime(),
  /** User's target ceiling for total landed cost, in cents. Optional. */
  maxBudgetCents: z.number().int().nonnegative().optional(),
  condition: ItemCondition.default('new'),
  currency: z.string().default('INR'),
  /** Stores the user is willing to buy from; empty = all available stores. */
  allowedStores: z.array(StoreId).default([]),
  status: WishStatus.default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Wish = z.infer<typeof Wish>;

/** A single price observation from one store, with computed landed cost. */
export const Offer = z.object({
  id: z.string(),
  wishId: z.string(),
  store: StoreId,
  externalId: z.string(),
  title: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  condition: ItemCondition,
  currency: z.string(),
  itemPriceCents: z.number().int().nonnegative(),
  shippingCents: z.number().int().nonnegative(),
  /** Estimated tax for the destination, in cents. */
  taxCents: z.number().int().nonnegative(),
  /** Coupon / cashback applied, in cents (subtracted from total). */
  discountCents: z.number().int().nonnegative().default(0),
  /** itemPrice + shipping + tax − discount. The number we optimise. */
  totalLandedCents: z.number().int().nonnegative(),
  inStock: z.boolean(),
  rating: z.number().min(0).max(5).optional(),
  estDeliveryDays: z.number().int().nonnegative().optional(),
  capturedAt: z.string().datetime(),
});
export type Offer = z.infer<typeof Offer>;

/** Audit record of one daily search pass over a wish. */
export const SearchRun = z.object({
  id: z.string(),
  wishId: z.string(),
  ranAt: z.string().datetime(),
  storesQueried: z.array(StoreId),
  offersFound: z.number().int().nonnegative(),
  bestOfferId: z.string().optional(),
  bestLandedCents: z.number().int().nonnegative().optional(),
  triggeredApproval: z.boolean().default(false),
  note: z.string().default(''),
});
export type SearchRun = z.infer<typeof SearchRun>;

/** A human-in-the-loop purchase proposal awaiting (or carrying) a decision. */
export const PurchaseDecision = z.object({
  id: z.string(),
  wishId: z.string(),
  offerId: z.string(),
  status: DecisionStatus,
  reason: z.string().default(''),
  totalLandedCents: z.number().int().nonnegative(),
  currency: z.string(),
  proposedAt: z.string().datetime(),
  decidedAt: z.string().datetime().optional(),
  /** Confirmation reference from the checkout provider once placed. */
  confirmationRef: z.string().optional(),
});
export type PurchaseDecision = z.infer<typeof PurchaseDecision>;

export const Notification = z.object({
  id: z.string(),
  userId: z.string(),
  wishId: z.string().optional(),
  type: NotificationType,
  title: z.string(),
  body: z.string(),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof Notification>;

// ── API DTOs (request payloads) ──────────────────────────────────────────────

export const CreateWishInput = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  keywords: z.array(z.string()).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  desiredByDate: z.string().datetime(),
  maxBudgetCents: z.number().int().nonnegative().optional(),
  condition: ItemCondition.optional(),
  currency: z.string().optional(),
  allowedStores: z.array(StoreId).optional(),
});
export type CreateWishInput = z.infer<typeof CreateWishInput>;

export const UpdateWishInput = CreateWishInput.partial().extend({
  status: WishStatus.optional(),
});
export type UpdateWishInput = z.infer<typeof UpdateWishInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const DecisionInput = z.object({
  approve: z.boolean(),
  reason: z.string().max(500).optional(),
});
export type DecisionInput = z.infer<typeof DecisionInput>;

// ── API response envelopes ───────────────────────────────────────────────────

/** A wish enriched with its current best offer + pending decision for the UI. */
export const WishView = z.object({
  wish: Wish,
  bestOffer: Offer.nullable(),
  recentOffers: z.array(Offer),
  pendingDecision: PurchaseDecision.nullable(),
  lastSearchRun: SearchRun.nullable(),
  /** Savings vs. the median landed cost across stores, in cents. */
  savingsVsMedianCents: z.number().int().optional(),
});
export type WishView = z.infer<typeof WishView>;

export const AuthResponse = z.object({
  token: z.string(),
  user: User,
});
export type AuthResponse = z.infer<typeof AuthResponse>;
