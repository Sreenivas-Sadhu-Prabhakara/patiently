import type { Offer } from '@patiently/shared';

export interface CheckoutResult {
  success: boolean;
  confirmationRef?: string;
  error?: string;
}

/**
 * Boundary for actually placing an order once a user approves. Kept behind an
 * interface because real automated checkout is the riskiest part of the product
 * and varies wildly per store:
 *   • payment vaulting / PCI compliance (e.g. Stripe + saved payment methods),
 *   • per-store cart + checkout automation or partner/affiliate purchase APIs,
 *   • fraud, address/tax validation, returns and refunds.
 * For the MVP we ship a simulated provider so the end-to-end approve→buy flow is
 * demonstrable; production swaps in a real provider with no service changes.
 */
export interface CheckoutProvider {
  placeOrder(offer: Offer): Promise<CheckoutResult>;
}

/** Simulated checkout: always succeeds and returns a synthetic confirmation. */
export class MockCheckoutProvider implements CheckoutProvider {
  async placeOrder(offer: Offer): Promise<CheckoutResult> {
    const ref = `PAT-${offer.store.toUpperCase()}-${offer.externalId}-${Date.now().toString(36)}`;
    return { success: true, confirmationRef: ref };
  }
}
