import { randomUUID } from 'node:crypto';
import {
  formatMoney,
  type Offer,
  type SearchRun,
  type StoreId,
  type Wish,
} from '@patiently/shared';
import type { BackendConfig } from '../config/env.js';
import type { Repository } from '../repository/repository.js';
import type { RawOffer, SearchQuery, StoreAdapter } from '../adapters/types.js';
import { computeLandedCost } from '../engine/landed-cost.js';
import { evaluateProposal, summarize } from '../engine/frugality-engine.js';
import type { NotificationService } from './notification-service.js';

/** Days past the desired-by date after which an unfulfilled wish is expired. */
const EXPIRY_GRACE_DAYS = 3;

export interface SearchRunResult {
  run: SearchRun;
  proposedDecisionId?: string;
}

/**
 * The daily-search worker. For each active wish it queries every eligible store,
 * computes true landed cost, ranks the results, records an auditable SearchRun,
 * and — when the frugality engine says today's best price is worth acting on —
 * creates a purchase proposal and notifies the user for one-tap approval.
 */
export class SearchService {
  constructor(
    private readonly repo: Repository,
    private readonly adapters: StoreAdapter[],
    private readonly config: BackendConfig,
    private readonly notifications: NotificationService,
  ) {}

  /** Run the daily search for every active wish; returns one result per wish. */
  async runDaily(): Promise<SearchRunResult[]> {
    const wishes = await this.repo.listActiveWishes();
    const results: SearchRunResult[] = [];
    for (const wish of wishes) {
      try {
        results.push(await this.runForWish(wish));
      } catch (err) {
        console.error(`[search] wish ${wish.id} failed:`, err);
      }
    }
    return results;
  }

  async runForWish(wish: Wish): Promise<SearchRunResult> {
    const now = new Date();

    // Expire wishes that have run past their horizon without a purchase.
    const daysLeft = Math.ceil(
      (new Date(wish.desiredByDate).getTime() - now.getTime()) / 86_400_000,
    );
    if (daysLeft < -EXPIRY_GRACE_DAYS && wish.status !== 'purchased') {
      await this.repo.updateWish(wish.id, { status: 'expired' });
      await this.notifications.notify({
        userId: wish.userId,
        wishId: wish.id,
        type: 'expiring_soon',
        title: `“${wish.title}” expired`,
        body: 'We passed your desired-by date without a purchase. Reopen it any time.',
      });
      const run = this.emptyRun(wish, now, 'Wish expired past its horizon.');
      await this.repo.addSearchRun(run);
      return { run };
    }

    const query = this.buildQuery(wish);
    const activeAdapters = this.adaptersFor(wish);

    const captured = await this.captureOffers(wish, query, activeAdapters, now);
    if (captured.length > 0) await this.repo.addOffers(captured);

    const summary = summarize(captured, wish);
    const run: SearchRun = {
      id: randomUUID(),
      wishId: wish.id,
      ranAt: now.toISOString(),
      storesQueried: activeAdapters.map((a) => a.id),
      offersFound: captured.length,
      ...(summary.best
        ? { bestOfferId: summary.best.id, bestLandedCents: summary.best.totalLandedCents }
        : {}),
      triggeredApproval: false,
      note: '',
    };

    // Don't stack proposals: only act if none is already pending.
    const existingPending = await this.repo.getPendingDecisionForWish(wish.id);
    if (!existingPending && wish.status === 'active') {
      const decision = evaluateProposal(summary, wish, now);
      if (decision.propose && summary.best) {
        const proposed = await this.proposePurchase(wish, summary.best, decision.reason);
        run.triggeredApproval = true;
        run.note = decision.reason;
        await this.repo.addSearchRun(run);
        return { run, proposedDecisionId: proposed };
      }
      run.note = decision.reason;
    } else if (existingPending) {
      run.note = 'Awaiting your decision on an existing proposal.';
    }

    await this.repo.addSearchRun(run);
    return { run };
  }

  private async proposePurchase(wish: Wish, best: Offer, reason: string): Promise<string> {
    const decision = await this.repo.createDecision({
      id: randomUUID(),
      wishId: wish.id,
      offerId: best.id,
      status: 'proposed',
      reason,
      totalLandedCents: best.totalLandedCents,
      currency: best.currency,
      proposedAt: new Date().toISOString(),
    });
    await this.repo.updateWish(wish.id, { status: 'awaiting_approval' });
    await this.notifications.notify({
      userId: wish.userId,
      wishId: wish.id,
      type: 'approval_needed',
      title: `Ready to buy: ${wish.title}`,
      body: `${formatMoney(best.totalLandedCents, best.currency)} shipped from ${best.store}. ${reason} Approve to purchase.`,
    });
    return decision.id;
  }

  private async captureOffers(
    wish: Wish,
    query: SearchQuery,
    adapters: StoreAdapter[],
    now: Date,
  ): Promise<Offer[]> {
    const capturedAt = now.toISOString();
    const perAdapter = await Promise.all(
      adapters.map(async (adapter) => {
        try {
          const raws = await adapter.search(query);
          return raws.map((raw) => this.toOffer(wish, adapter.id, raw, capturedAt));
        } catch (err) {
          console.error(`[search] adapter ${adapter.id} failed for wish ${wish.id}:`, err);
          return [] as Offer[];
        }
      }),
    );
    return perAdapter.flat();
  }

  private toOffer(wish: Wish, store: StoreId, raw: RawOffer, capturedAt: string): Offer {
    const landed = computeLandedCost(raw, this.config);
    return {
      id: randomUUID(),
      wishId: wish.id,
      store,
      externalId: raw.externalId,
      title: raw.title,
      url: raw.url,
      ...(raw.imageUrl ? { imageUrl: raw.imageUrl } : {}),
      condition: raw.condition,
      currency: raw.currency,
      itemPriceCents: raw.itemPriceCents,
      shippingCents: landed.shippingCents,
      taxCents: landed.taxCents,
      discountCents: landed.discountCents,
      totalLandedCents: landed.totalLandedCents,
      inStock: raw.inStock,
      ...(raw.rating !== undefined ? { rating: raw.rating } : {}),
      ...(raw.estDeliveryDays !== undefined ? { estDeliveryDays: raw.estDeliveryDays } : {}),
      capturedAt,
    };
  }

  private adaptersFor(wish: Wish): StoreAdapter[] {
    if (wish.allowedStores.length === 0) return this.adapters;
    const allowed = new Set(wish.allowedStores);
    return this.adapters.filter((a) => allowed.has(a.id));
  }

  private buildQuery(wish: Wish): SearchQuery {
    return {
      text: wish.title,
      keywords: wish.keywords,
      ...(wish.brand ? { brand: wish.brand } : {}),
      ...(wish.model ? { model: wish.model } : {}),
      condition: wish.condition,
      currency: wish.currency,
      destinationCountry: this.config.DEFAULT_DESTINATION_COUNTRY,
      destinationPostal: this.config.DEFAULT_DESTINATION_POSTAL,
      ...(wish.maxBudgetCents !== undefined ? { maxBudgetCents: wish.maxBudgetCents } : {}),
    };
  }

  private emptyRun(wish: Wish, now: Date, note: string): SearchRun {
    return {
      id: randomUUID(),
      wishId: wish.id,
      ranAt: now.toISOString(),
      storesQueried: [],
      offersFound: 0,
      triggeredApproval: false,
      note,
    };
  }
}
