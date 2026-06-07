import type { StoreId } from '@patiently/shared';
import type { BackendConfig } from '../config/env.js';
import { AmazonAdapter } from './amazon-adapter.js';
import { FlipkartAdapter } from './flipkart-adapter.js';
import { MockAdapter } from './mock-adapter.js';
import type { StoreAdapter } from './types.js';

const STORE_NAMES: Record<StoreId, string> = {
  amazon_in: 'Amazon.in',
  flipkart: 'Flipkart',
  croma: 'Croma',
  reliance_digital: 'Reliance Digital',
  tata_cliq: 'Tata CLiQ',
  myntra: 'Myntra',
};

/** India stores that don't yet have a live API adapter → always mock. */
const MOCK_ONLY_STORES: StoreId[] = ['croma', 'reliance_digital', 'tata_cliq', 'myntra'];

/**
 * Build the active set of India store adapters. For each store with a live
 * integration (Amazon.in, Flipkart) we prefer the real API when its credentials
 * are present, and otherwise transparently fall back to the deterministic mock
 * feed — so the product is fully functional with zero keys and upgrades to live
 * data one store at a time. Stores without a live adapter use the mock feed (a
 * clean template for adding the next real integration).
 */
export function buildAdapters(config: BackendConfig): StoreAdapter[] {
  const live: StoreAdapter[] = [new AmazonAdapter(config), new FlipkartAdapter(config)];

  const adapters: StoreAdapter[] = live.map((adapter) =>
    adapter.isConfigured() ? adapter : new MockAdapter(adapter.id, adapter.name),
  );

  for (const id of MOCK_ONLY_STORES) {
    adapters.push(new MockAdapter(id, STORE_NAMES[id]));
  }

  return adapters;
}

/** Human-readable summary of which stores are live vs. mock, for boot logs. */
export function describeAdapters(adapters: StoreAdapter[]): string {
  return adapters.map((a) => `${a.name}: ${a.isLive ? 'LIVE' : 'mock'}`).join(', ');
}
