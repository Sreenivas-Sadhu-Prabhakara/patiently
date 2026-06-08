import type {
  DeviceToken,
  Notification,
  Offer,
  PurchaseDecision,
  SearchRun,
  User,
  Wish,
} from '@patiently/shared';

/**
 * Persistence boundary for the whole domain. Services depend only on this
 * interface, never on a concrete store — so swapping the JSON-file MVP store for
 * Postgres/Prisma in production is a one-line change in the container.
 */
export interface Repository {
  init(): Promise<void>;

  // Users
  createUser(user: User): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;

  // Wishes
  createWish(wish: Wish): Promise<Wish>;
  getWish(id: string): Promise<Wish | null>;
  listWishesByUser(userId: string): Promise<Wish[]>;
  listActiveWishes(): Promise<Wish[]>;
  updateWish(id: string, patch: Partial<Wish>): Promise<Wish>;

  // Offers
  addOffers(offers: Offer[]): Promise<void>;
  getOffer(id: string): Promise<Offer | null>;
  /** Offers for a wish, newest capture first. */
  listOffersByWish(wishId: string, limit?: number): Promise<Offer[]>;

  // Search runs
  addSearchRun(run: SearchRun): Promise<void>;
  getLatestSearchRun(wishId: string): Promise<SearchRun | null>;

  // Purchase decisions
  createDecision(decision: PurchaseDecision): Promise<PurchaseDecision>;
  getDecision(id: string): Promise<PurchaseDecision | null>;
  getPendingDecisionForWish(wishId: string): Promise<PurchaseDecision | null>;
  updateDecision(id: string, patch: Partial<PurchaseDecision>): Promise<PurchaseDecision>;

  // Notifications
  addNotification(notification: Notification): Promise<Notification>;
  listNotificationsByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;

  // Push device tokens
  upsertDeviceToken(token: DeviceToken): Promise<DeviceToken>;
  listDeviceTokensByUser(userId: string): Promise<DeviceToken[]>;
  removeDeviceToken(token: string): Promise<void>;
}
