import type { StoreId } from '@patiently/shared';
import { toCents } from '@patiently/shared';
import type { BackendConfig } from '../config/env.js';
import type { RawOffer, SearchQuery, StoreAdapter } from './types.js';

/**
 * Generic integration for India retailers that expose a partner/affiliate
 * storefront API (Croma, Reliance Digital, Tata CLiQ, Myntra). These chains
 * don't publish an open product API like Amazon PA-API or the Flipkart Affiliate
 * API, so each integration is gated behind a partner base URL + API key you
 * obtain from the retailer. Until those are configured, the registry substitutes
 * the deterministic mock feed for the store.
 *
 * The adapter normalises each store's response to a common product shape
 * (`PartnerProduct`); when you onboard a real partner API whose JSON differs,
 * adjust `mapProduct` (or the `productsPath`) for that store only.
 */
export interface PartnerConfig {
  id: StoreId;
  name: string;
  baseUrl?: string;
  apiKey?: string;
  /** Path segment appended to baseUrl for search (default: "/search"). */
  searchPath?: string;
}

interface PartnerProduct {
  id?: string | number;
  sku?: string | number;
  productId?: string | number;
  name?: string;
  title?: string;
  url?: string;
  productUrl?: string;
  image?: string;
  imageUrl?: string;
  price?: number;
  sellingPrice?: number;
  salePrice?: number;
  mrp?: number;
  inStock?: boolean;
  rating?: number;
}

function num(...values: Array<number | undefined>): number | undefined {
  return values.find((v) => typeof v === 'number');
}

export class PartnerApiAdapter implements StoreAdapter {
  readonly isLive = true;

  constructor(private readonly cfg: PartnerConfig) {}

  get id(): StoreId {
    return this.cfg.id;
  }
  get name(): string {
    return this.cfg.name;
  }

  isConfigured(): boolean {
    return Boolean(this.cfg.baseUrl && this.cfg.apiKey);
  }

  async search(query: SearchQuery): Promise<RawOffer[]> {
    const terms = [query.text, query.brand, query.model].filter(Boolean).join(' ');
    const base = this.cfg.baseUrl!.replace(/\/$/, '');
    const path = this.cfg.searchPath ?? '/search';
    const url = `${base}${path}?q=${encodeURIComponent(terms)}&limit=20`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        'x-api-key': this.cfg.apiKey!,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`${this.name} search failed: ${res.status} ${await res.text()}`);

    const json = (await res.json()) as { products?: PartnerProduct[] };
    return (json.products ?? [])
      .map((p) => this.mapProduct(p, query))
      .filter((o): o is RawOffer => o !== null);
  }

  private mapProduct(p: PartnerProduct, query: SearchQuery): RawOffer | null {
    const price = num(p.price, p.sellingPrice, p.salePrice);
    const url = p.url ?? p.productUrl;
    const externalId = String(p.id ?? p.sku ?? p.productId ?? url ?? '');
    if (price === undefined || !url || !externalId) return null;

    const discount =
      typeof p.mrp === 'number' && p.mrp > price ? Math.round((p.mrp - price) * 100) : 0;

    return {
      externalId,
      title: p.name ?? p.title ?? query.text,
      url,
      ...((p.image ?? p.imageUrl) ? { imageUrl: p.image ?? p.imageUrl } : {}),
      condition: 'new',
      currency: query.currency,
      itemPriceCents: toCents(price),
      discountCents: discount,
      // shipping unknown → the landed-cost engine applies the India heuristic.
      inStock: p.inStock ?? true,
      ...(typeof p.rating === 'number' ? { rating: p.rating } : {}),
    };
  }
}

/** Build the partner-API config for the four India retailers from env. */
export function partnerConfigs(config: BackendConfig): PartnerConfig[] {
  return [
    {
      id: 'croma',
      name: 'Croma',
      baseUrl: config.CROMA_API_BASE,
      apiKey: config.CROMA_API_KEY,
    },
    {
      id: 'reliance_digital',
      name: 'Reliance Digital',
      baseUrl: config.RELIANCE_DIGITAL_API_BASE,
      apiKey: config.RELIANCE_DIGITAL_API_KEY,
    },
    {
      id: 'tata_cliq',
      name: 'Tata CLiQ',
      baseUrl: config.TATA_CLIQ_API_BASE,
      apiKey: config.TATA_CLIQ_API_KEY,
    },
    {
      id: 'myntra',
      name: 'Myntra',
      baseUrl: config.MYNTRA_API_BASE,
      apiKey: config.MYNTRA_API_KEY,
    },
  ];
}
