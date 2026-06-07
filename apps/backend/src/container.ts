import { loadConfig, type BackendConfig } from './config/env.js';
import { JsonFileRepository } from './repository/json-file-repository.js';
import type { Repository } from './repository/repository.js';
import { buildAdapters, describeAdapters } from './adapters/registry.js';
import type { StoreAdapter } from './adapters/types.js';
import { MockCheckoutProvider, type CheckoutProvider } from './checkout/checkout-provider.js';
import { NotificationService } from './services/notification-service.js';
import { UserService } from './services/user-service.js';
import { WishService } from './services/wish-service.js';
import { SearchService } from './services/search-service.js';
import { PurchaseService } from './services/purchase-service.js';

/**
 * The composition root. Wires the concrete implementations (repository, store
 * adapters, checkout provider) into the domain services and hands back a single
 * `Backend` facade. The middleware depends only on this facade — so the backend
 * can later be extracted into its own deployable service behind the same shape.
 */
export interface Backend {
  config: BackendConfig;
  repository: Repository;
  adapters: StoreAdapter[];
  users: UserService;
  wishes: WishService;
  search: SearchService;
  purchases: PurchaseService;
  notifications: NotificationService;
}

export interface CreateBackendOptions {
  config?: BackendConfig;
  repository?: Repository;
  adapters?: StoreAdapter[];
  checkout?: CheckoutProvider;
}

export async function createBackend(options: CreateBackendOptions = {}): Promise<Backend> {
  const config = options.config ?? loadConfig();
  const repository = options.repository ?? new JsonFileRepository(config.DATA_DIR);
  await repository.init();

  const adapters = options.adapters ?? buildAdapters(config);
  const checkout = options.checkout ?? new MockCheckoutProvider();

  const notifications = new NotificationService(repository);
  const users = new UserService(repository);
  const wishes = new WishService(repository);
  const search = new SearchService(repository, adapters, config, notifications);
  const purchases = new PurchaseService(repository, checkout, notifications);

  console.log(`[backend] store adapters → ${describeAdapters(adapters)}`);

  return { config, repository, adapters, users, wishes, search, purchases, notifications };
}
