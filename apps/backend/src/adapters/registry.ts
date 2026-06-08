import type { StoreId } from '@patiently/shared';
import type { BackendConfig } from '../config/env.js';
import { AmazonAdapter } from './amazon-adapter.js';
import { FlipkartAdapter } from './flipkart-adapter.js';
import { MockAdapter } from './mock-adapter.js';
import { PartnerApiAdapter, partnerConfigs } from './partner-adapters.js';
import type { StoreAdapter } from './types.js';

const STORE_NAMES: Record<StoreId, string> = {
  amazon_in: 'Amazon.in',
  flipkart: 'Flipkart',
  croma: 'Croma',
  reliance_digital: 'Reliance Digital',
  tata_cliq: 'Tata CLiQ',
  myntra: 'Myntra',
};

/**
 * Build the active set of India store adapters. Each store prefers its live API
 * adapter when credentials are present and otherwise transparently falls back to
 * the deterministic mock feed — so the product is fully functional with zero keys
 * and upgrades to live data one store at a time:
 *
 *   • Amazon.in     — Product Advertising API v5 (AMAZON_*)
 *   • Flipkart      — Affiliate API (FLIPKART_*)
 *   • Croma · Reliance Digital · Tata CLiQ · Myntra — partner storefront API
 *     (<STORE>_API_BASE + <STORE>_API_KEY), via the generic PartnerApiAdapter.
 */
export function buildAdapters(config: BackendConfig): StoreAdapter[] {
  const live: StoreAdapter[] = [
    new AmazonAdapter(config),
    new FlipkartAdapter(config),
    ...partnerConfigs(config).map((cfg) => new PartnerApiAdapter(cfg)),
  ];

  return live.map((adapter) =>
    adapter.isConfigured() ? adapter : new MockAdapter(adapter.id, STORE_NAMES[adapter.id]),
  );
}

/** Human-readable summary of which stores are live vs. mock, for boot logs. */
export function describeAdapters(adapters: StoreAdapter[]): string {
  return adapters.map((a) => `${a.name}: ${a.isLive ? 'LIVE' : 'mock'}`).join(', ');
}
