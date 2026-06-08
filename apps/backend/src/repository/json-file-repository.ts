import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type {
  DeviceToken,
  Notification,
  Offer,
  PurchaseDecision,
  SearchRun,
  User,
  Wish,
} from '@patiently/shared';
import type { Repository } from './repository.js';

interface Database {
  users: User[];
  wishes: Wish[];
  offers: Offer[];
  searchRuns: SearchRun[];
  decisions: PurchaseDecision[];
  notifications: Notification[];
  deviceTokens: DeviceToken[];
}

const EMPTY_DB: Database = {
  users: [],
  wishes: [],
  offers: [],
  searchRuns: [],
  decisions: [],
  notifications: [],
  deviceTokens: [],
};

/**
 * Simple persistent repository backed by a single JSON file. Suitable for the
 * MVP and local development: the whole DB is held in memory and flushed to disk
 * after each mutation (serialised to avoid interleaved writes). For production
 * scale, implement `Repository` over Postgres and swap it in the container.
 */
export class JsonFileRepository implements Repository {
  private db: Database = structuredClone(EMPTY_DB);
  private readonly file: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(dataDir: string) {
    this.file = resolve(join(dataDir, 'patiently.json'));
  }

  async init(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    try {
      const raw = await readFile(this.file, 'utf8');
      this.db = { ...structuredClone(EMPTY_DB), ...(JSON.parse(raw) as Partial<Database>) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      await this.persist(); // create the file on first boot
    }
  }

  /** Serialise writes so concurrent mutations never corrupt the file. */
  private persist(): Promise<void> {
    this.writeChain = this.writeChain.then(() =>
      writeFile(this.file, JSON.stringify(this.db, null, 2), 'utf8'),
    );
    return this.writeChain;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async createUser(user: User): Promise<User> {
    this.db.users.push(user);
    await this.persist();
    return user;
  }
  async getUser(id: string): Promise<User | null> {
    return this.db.users.find((u) => u.id === id) ?? null;
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase();
    return this.db.users.find((u) => u.email.toLowerCase() === lower) ?? null;
  }

  // ── Wishes ─────────────────────────────────────────────────────────────────
  async createWish(wish: Wish): Promise<Wish> {
    this.db.wishes.push(wish);
    await this.persist();
    return wish;
  }
  async getWish(id: string): Promise<Wish | null> {
    return this.db.wishes.find((w) => w.id === id) ?? null;
  }
  async listWishesByUser(userId: string): Promise<Wish[]> {
    return this.db.wishes
      .filter((w) => w.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listActiveWishes(): Promise<Wish[]> {
    return this.db.wishes.filter((w) => w.status === 'active' || w.status === 'awaiting_approval');
  }
  async updateWish(id: string, patch: Partial<Wish>): Promise<Wish> {
    const wish = this.db.wishes.find((w) => w.id === id);
    if (!wish) throw new Error(`Wish not found: ${id}`);
    Object.assign(wish, patch, { updatedAt: new Date().toISOString() });
    await this.persist();
    return wish;
  }

  // ── Offers ─────────────────────────────────────────────────────────────────
  async addOffers(offers: Offer[]): Promise<void> {
    this.db.offers.push(...offers);
    await this.persist();
  }
  async getOffer(id: string): Promise<Offer | null> {
    return this.db.offers.find((o) => o.id === id) ?? null;
  }
  async listOffersByWish(wishId: string, limit?: number): Promise<Offer[]> {
    const offers = this.db.offers
      .filter((o) => o.wishId === wishId)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    return limit ? offers.slice(0, limit) : offers;
  }

  // ── Search runs ────────────────────────────────────────────────────────────
  async addSearchRun(run: SearchRun): Promise<void> {
    this.db.searchRuns.push(run);
    await this.persist();
  }
  async getLatestSearchRun(wishId: string): Promise<SearchRun | null> {
    return (
      this.db.searchRuns
        .filter((r) => r.wishId === wishId)
        .sort((a, b) => b.ranAt.localeCompare(a.ranAt))[0] ?? null
    );
  }

  // ── Purchase decisions ─────────────────────────────────────────────────────
  async createDecision(decision: PurchaseDecision): Promise<PurchaseDecision> {
    this.db.decisions.push(decision);
    await this.persist();
    return decision;
  }
  async getDecision(id: string): Promise<PurchaseDecision | null> {
    return this.db.decisions.find((d) => d.id === id) ?? null;
  }
  async getPendingDecisionForWish(wishId: string): Promise<PurchaseDecision | null> {
    return this.db.decisions.find((d) => d.wishId === wishId && d.status === 'proposed') ?? null;
  }
  async updateDecision(id: string, patch: Partial<PurchaseDecision>): Promise<PurchaseDecision> {
    const decision = this.db.decisions.find((d) => d.id === id);
    if (!decision) throw new Error(`Decision not found: ${id}`);
    Object.assign(decision, patch);
    await this.persist();
    return decision;
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  async addNotification(notification: Notification): Promise<Notification> {
    this.db.notifications.push(notification);
    await this.persist();
    return notification;
  }
  async listNotificationsByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    return this.db.notifications
      .filter((n) => n.userId === userId && (!unreadOnly || !n.read))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async markNotificationRead(id: string): Promise<void> {
    const n = this.db.notifications.find((x) => x.id === id);
    if (n) {
      n.read = true;
      await this.persist();
    }
  }

  // ── Push device tokens ─────────────────────────────────────────────────────
  async upsertDeviceToken(token: DeviceToken): Promise<DeviceToken> {
    const existing = this.db.deviceTokens.find((d) => d.token === token.token);
    if (existing) {
      existing.userId = token.userId;
      existing.platform = token.platform;
    } else {
      this.db.deviceTokens.push(token);
    }
    await this.persist();
    return existing ?? token;
  }
  async listDeviceTokensByUser(userId: string): Promise<DeviceToken[]> {
    return this.db.deviceTokens.filter((d) => d.userId === userId);
  }
  async removeDeviceToken(token: string): Promise<void> {
    this.db.deviceTokens = this.db.deviceTokens.filter((d) => d.token !== token);
    await this.persist();
  }
}
