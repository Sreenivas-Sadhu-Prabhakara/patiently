import { createHash, createHmac } from 'node:crypto';
import { toCents } from '@patiently/shared';
import type { BackendConfig } from '../config/env.js';
import type { RawOffer, SearchQuery, StoreAdapter } from './types.js';

const SERVICE = 'ProductAdvertisingAPI';
const PATH = '/paapi5/searchitems';
const TARGET = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';

interface PaapiListing {
  Price?: { Amount?: number; Currency?: string };
  DeliveryInfo?: { IsFreeShippingEligible?: boolean };
  Availability?: { Type?: string };
}
interface PaapiItem {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo?: { Title?: { DisplayValue?: string } };
  Images?: { Primary?: { Medium?: { URL?: string } } };
  Offers?: { Listings?: PaapiListing[] };
  CustomerReviews?: { StarRating?: { Value?: number } };
}

/** AWS Signature V4 signing key derivation. */
function signingKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate = createHmac('sha256', `AWS4${secret}`).update(date).digest();
  const kRegion = createHmac('sha256', kDate).update(region).digest();
  const kService = createHmac('sha256', kRegion).update(service).digest();
  return createHmac('sha256', kService).update('aws4_request').digest();
}

const sha256Hex = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

/**
 * Live adapter for the Amazon India Product Advertising API v5 (host
 * webservices.amazon.in, region eu-west-1, marketplace www.amazon.in). Active
 * only when the AMAZON_* credentials are set. Requests are signed with AWS
 * SigV4. Docs: https://webservices.amazon.com/paapi5/documentation/
 *
 * Note: PA-API access requires an approved Amazon Associates (India) account
 * with recent qualifying sales; until keys are provided the registry uses mock.
 */
export class AmazonAdapter implements StoreAdapter {
  readonly id = 'amazon_in' as const;
  readonly name = 'Amazon.in';
  readonly isLive = true;

  constructor(private readonly config: BackendConfig) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.AMAZON_ACCESS_KEY &&
      this.config.AMAZON_SECRET_KEY &&
      this.config.AMAZON_PARTNER_TAG,
    );
  }

  async search(query: SearchQuery): Promise<RawOffer[]> {
    const { AMAZON_HOST: host, AMAZON_REGION: region } = this.config;
    const payload = JSON.stringify({
      Keywords: [query.text, query.brand, query.model].filter(Boolean).join(' '),
      SearchIndex: 'All',
      ItemCount: 10,
      PartnerTag: this.config.AMAZON_PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: this.config.AMAZON_MARKETPLACE,
      Resources: [
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'Offers.Listings.DeliveryInfo.IsFreeShippingEligible',
        'Offers.Listings.Availability.Type',
        'Images.Primary.Medium',
        'CustomerReviews.StarRating',
      ],
    });

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
    const dateStamp = amzDate.slice(0, 8);

    const canonicalHeaders =
      `content-encoding:amz-1.0\n` +
      `host:${host}\n` +
      `x-amz-date:${amzDate}\n` +
      `x-amz-target:${TARGET}\n`;
    const signedHeaders = 'content-encoding;host;x-amz-date;x-amz-target';
    const canonicalRequest = [
      'POST',
      PATH,
      '',
      canonicalHeaders,
      signedHeaders,
      sha256Hex(payload),
    ].join('\n');

    const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join(
      '\n',
    );

    const signature = createHmac(
      'sha256',
      signingKey(this.config.AMAZON_SECRET_KEY!, dateStamp, region, SERVICE),
    )
      .update(stringToSign)
      .digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${this.config.AMAZON_ACCESS_KEY}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(`https://${host}${PATH}`, {
      method: 'POST',
      headers: {
        'content-encoding': 'amz-1.0',
        'content-type': 'application/json; charset=utf-8',
        host,
        'x-amz-date': amzDate,
        'x-amz-target': TARGET,
        Authorization: authorization,
      },
      body: payload,
    });
    if (!res.ok) throw new Error(`Amazon PA-API search failed: ${res.status} ${await res.text()}`);

    const json = (await res.json()) as { SearchResult?: { Items?: PaapiItem[] } };
    return (json.SearchResult?.Items ?? [])
      .map((item): RawOffer | null => {
        const listing = item.Offers?.Listings?.[0];
        const amount = listing?.Price?.Amount;
        if (typeof amount !== 'number') return null;
        return {
          externalId: item.ASIN,
          title: item.ItemInfo?.Title?.DisplayValue ?? item.ASIN,
          url: item.DetailPageURL,
          imageUrl: item.Images?.Primary?.Medium?.URL,
          condition: 'new',
          currency: listing?.Price?.Currency ?? query.currency,
          itemPriceCents: toCents(amount),
          shippingCents: listing?.DeliveryInfo?.IsFreeShippingEligible ? 0 : undefined,
          inStock: listing?.Availability?.Type !== 'OutOfStock',
          rating: item.CustomerReviews?.StarRating?.Value,
        };
      })
      .filter((o): o is RawOffer => o !== null);
  }
}
