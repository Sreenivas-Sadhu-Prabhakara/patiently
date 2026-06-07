import { randomUUID } from 'node:crypto';
import {
  CreateWishInput,
  UpdateWishInput,
  type Offer,
  type Wish,
  type WishView,
} from '@patiently/shared';
import type { Repository } from '../repository/repository.js';
import { summarize } from '../engine/frugality-engine.js';

/** Raised when a user references a wish they don't own / that doesn't exist. */
export class WishNotFoundError extends Error {
  constructor(id: string) {
    super(`Wish not found: ${id}`);
    this.name = 'WishNotFoundError';
  }
}

export class WishService {
  constructor(private readonly repo: Repository) {}

  async createWish(userId: string, raw: unknown): Promise<Wish> {
    const input: CreateWishInput = CreateWishInput.parse(raw);
    if (new Date(input.desiredByDate).getTime() <= Date.now()) {
      throw new Error('desiredByDate must be in the future (your 3–6 month horizon).');
    }
    const now = new Date().toISOString();
    const wish: Wish = {
      id: randomUUID(),
      userId,
      title: input.title,
      description: input.description ?? '',
      keywords: input.keywords ?? [],
      category: input.category ?? 'general',
      ...(input.brand ? { brand: input.brand } : {}),
      ...(input.model ? { model: input.model } : {}),
      desiredByDate: input.desiredByDate,
      ...(input.maxBudgetCents !== undefined ? { maxBudgetCents: input.maxBudgetCents } : {}),
      condition: input.condition ?? 'new',
      currency: input.currency ?? 'INR',
      allowedStores: input.allowedStores ?? [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.createWish(wish);
  }

  async getOwnedWish(userId: string, wishId: string): Promise<Wish> {
    const wish = await this.repo.getWish(wishId);
    if (!wish || wish.userId !== userId) throw new WishNotFoundError(wishId);
    return wish;
  }

  listWishes(userId: string): Promise<Wish[]> {
    return this.repo.listWishesByUser(userId);
  }

  async updateWish(userId: string, wishId: string, raw: unknown): Promise<Wish> {
    await this.getOwnedWish(userId, wishId);
    const patch: UpdateWishInput = UpdateWishInput.parse(raw);
    return this.repo.updateWish(wishId, patch);
  }

  async cancelWish(userId: string, wishId: string): Promise<Wish> {
    await this.getOwnedWish(userId, wishId);
    return this.repo.updateWish(wishId, { status: 'cancelled' });
  }

  /** Assemble the enriched, UI-ready view of a wish (best offer, savings, etc.). */
  async buildWishView(userId: string, wishId: string): Promise<WishView> {
    const wish = await this.getOwnedWish(userId, wishId);
    const allOffers = await this.repo.listOffersByWish(wishId);
    const latest = latestSnapshot(allOffers);
    const summary = summarize(latest, wish);
    const pendingDecision = await this.repo.getPendingDecisionForWish(wishId);
    const lastSearchRun = await this.repo.getLatestSearchRun(wishId);

    return {
      wish,
      bestOffer: summary.best,
      recentOffers: summary.ranked,
      pendingDecision,
      lastSearchRun,
      ...(summary.savingsVsMedianCents !== null
        ? { savingsVsMedianCents: summary.savingsVsMedianCents }
        : {}),
    };
  }

  async listWishViews(userId: string): Promise<WishView[]> {
    const wishes = await this.repo.listWishesByUser(userId);
    return Promise.all(wishes.map((w) => this.buildWishView(userId, w.id)));
  }
}

/** Keep only offers from the most recent capture (one daily snapshot). */
function latestSnapshot(offers: Offer[]): Offer[] {
  if (offers.length === 0) return [];
  const newest = offers.reduce(
    (max, o) => (o.capturedAt > max ? o.capturedAt : max),
    offers[0]!.capturedAt,
  );
  return offers.filter((o) => o.capturedAt === newest);
}
