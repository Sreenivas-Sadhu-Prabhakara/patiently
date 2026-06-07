import { toCents } from '@patiently/shared';
import type { BackendConfig } from '../config/env.js';
import type { RawOffer, SearchQuery, StoreAdapter } from './types.js';

interface FlipkartPrice {
  amount?: number;
  currency?: string;
}
interface FlipkartProductInfo {
  productId?: string;
  title?: string;
  productUrl?: string;
  imageUrls?: Record<string, string>;
  maximumRetailPrice?: FlipkartPrice;
  flipkartSellingPrice?: FlipkartPrice;
  flipkartSpecialPrice?: FlipkartPrice;
  productBrand?: string;
  inStock?: boolean;
  productRating?: number;
}
interface FlipkartProduct {
  productBaseInfoV1?: FlipkartProductInfo;
}

/**
 * Live adapter for the Flipkart Affiliate API. Active only when
 * FLIPKART_AFFILIATE_ID/TOKEN are set; otherwise the registry uses the mock
 * feed. Docs: https://affiliate.flipkart.com/api-docs/af-doc.html
 *
 * Flipkart prices are in INR and inclusive of GST, so we report shipping as
 * unknown (undefined) and let the landed-cost engine apply the India shipping
 * heuristic consistently across stores.
 */
export class FlipkartAdapter implements StoreAdapter {
  readonly id = 'flipkart' as const;
  readonly name = 'Flipkart';
  readonly isLive = true;

  constructor(private readonly config: BackendConfig) {}

  isConfigured(): boolean {
    return Boolean(this.config.FLIPKART_AFFILIATE_ID && this.config.FLIPKART_AFFILIATE_TOKEN);
  }

  async search(query: SearchQuery): Promise<RawOffer[]> {
    const q = [query.text, query.brand, query.model].filter(Boolean).join(' ');
    const url =
      `https://affiliate-api.flipkart.net/affiliate/1.0/search.json` +
      `?query=${encodeURIComponent(q)}&resultCount=20`;

    const res = await fetch(url, {
      headers: {
        'Fk-Affiliate-Id': this.config.FLIPKART_AFFILIATE_ID!,
        'Fk-Affiliate-Token': this.config.FLIPKART_AFFILIATE_TOKEN!,
      },
    });
    if (!res.ok) throw new Error(`Flipkart search failed: ${res.status} ${await res.text()}`);

    const json = (await res.json()) as { products?: FlipkartProduct[] };
    return (json.products ?? [])
      .map((p): RawOffer | null => {
        const info = p.productBaseInfoV1;
        const price = info?.flipkartSpecialPrice?.amount ?? info?.flipkartSellingPrice?.amount;
        if (!info || typeof price !== 'number' || !info.productUrl) return null;
        return {
          externalId: info.productId ?? info.productUrl,
          title: info.title ?? q,
          url: info.productUrl,
          ...(info.imageUrls?.['200x200'] ? { imageUrl: info.imageUrls['200x200'] } : {}),
          condition: 'new',
          currency: info.flipkartSellingPrice?.currency ?? query.currency,
          itemPriceCents: toCents(price),
          // shipping unknown → engine estimates with the India heuristic.
          inStock: info.inStock ?? true,
          ...(info.productRating !== undefined ? { rating: info.productRating } : {}),
        };
      })
      .filter((o): o is RawOffer => o !== null);
  }
}
