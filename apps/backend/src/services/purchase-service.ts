import { DecisionInput, formatMoney, type PurchaseDecision } from '@patiently/shared';
import type { Repository } from '../repository/repository.js';
import type { CheckoutProvider } from '../checkout/checkout-provider.js';
import type { NotificationService } from './notification-service.js';
import { WishNotFoundError } from './wish-service.js';

export class NoPendingDecisionError extends Error {
  constructor(wishId: string) {
    super(`No pending purchase decision for wish: ${wishId}`);
    this.name = 'NoPendingDecisionError';
  }
}

/**
 * Executes the user's decision on a proposed purchase. We never buy without an
 * explicit approval (human-in-the-loop): the daily worker proposes, this service
 * acts only on the user's command, then drives the wish to a terminal state.
 */
export class PurchaseService {
  constructor(
    private readonly repo: Repository,
    private readonly checkout: CheckoutProvider,
    private readonly notifications: NotificationService,
  ) {}

  async decide(userId: string, wishId: string, raw: unknown): Promise<PurchaseDecision> {
    const wish = await this.repo.getWish(wishId);
    if (!wish || wish.userId !== userId) throw new WishNotFoundError(wishId);

    const pending = await this.repo.getPendingDecisionForWish(wishId);
    if (!pending) throw new NoPendingDecisionError(wishId);

    const input: DecisionInput = DecisionInput.parse(raw);
    const decidedAt = new Date().toISOString();

    if (!input.approve) {
      const rejected = await this.repo.updateDecision(pending.id, {
        status: 'rejected',
        decidedAt,
        ...(input.reason ? { reason: input.reason } : {}),
      });
      await this.repo.updateWish(wishId, { status: 'active' }); // keep hunting
      return rejected;
    }

    // Approved → attempt checkout.
    await this.repo.updateWish(wishId, { status: 'purchasing' });
    await this.repo.updateDecision(pending.id, { status: 'approved', decidedAt });

    const offer = await this.repo.getOffer(pending.offerId);
    if (!offer) {
      await this.repo.updateWish(wishId, { status: 'active' });
      return this.repo.updateDecision(pending.id, {
        status: 'failed',
        reason: 'Offer no longer available.',
      });
    }

    const result = await this.checkout.placeOrder(offer);

    if (!result.success) {
      await this.repo.updateWish(wishId, { status: 'active' });
      await this.notifications.notify({
        userId,
        wishId,
        type: 'purchase_failed',
        title: `Couldn't complete: ${wish.title}`,
        body: result.error ?? 'Checkout failed. We will keep hunting.',
      });
      return this.repo.updateDecision(pending.id, {
        status: 'failed',
        reason: result.error ?? 'Checkout failed.',
      });
    }

    await this.repo.updateWish(wishId, { status: 'purchased' });
    await this.notifications.notify({
      userId,
      wishId,
      type: 'purchased',
      title: `Purchased: ${wish.title}`,
      body: `Ordered from ${offer.store} for ${formatMoney(offer.totalLandedCents, offer.currency)} shipped. Ref ${result.confirmationRef}.`,
    });
    return this.repo.updateDecision(pending.id, {
      status: 'placed',
      ...(result.confirmationRef ? { confirmationRef: result.confirmationRef } : {}),
    });
  }
}
