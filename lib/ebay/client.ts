import { EbayAccessTokenResponse, EbayBrowseSearchParams, EbayBrowseSearchResponse, ResaleIQCompResult } from './types';

const EBAY_BASE_URL = process.env.EBAY_ENVIRONMENT === 'production'
  ? 'https://api.ebay.com'
  : 'https://api.sandbox.ebay.com';

export async function getApplicationToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing eBay credentials');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${EBAY_BASE_URL}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate with eBay: ${response.status}`);
  }

  return response.json() as Promise<EbayAccessTokenResponse>;
}

export async function searchEbayListings(params: EbayBrowseSearchParams) {
  const token = await getApplicationToken();

  const query = new URLSearchParams({
    q: params.query,
    limit: String(params.limit ?? 10),
    offset: String(params.offset ?? 0)
  });

  if (params.filter) {
    query.append('filter', params.filter);
  }

  if (params.sort) {
    query.append('sort', params.sort);
  }

  const response = await fetch(
    `${EBAY_BASE_URL}/buy/browse/v1/item_summary/search?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`eBay Browse API failed: ${response.status}`);
  }

  return response.json() as Promise<EbayBrowseSearchResponse>;
}

export function normalizeCompResults(data: EbayBrowseSearchResponse): ResaleIQCompResult[] {
  return (data.itemSummaries ?? []).map((item) => ({
    title: item.title,
    price: item.price?.value ? Number(item.price.value) : null,
    currency: item.price?.currency ?? null,
    condition: item.condition ?? null,
    imageUrl: item.image?.imageUrl ?? null,
    itemUrl: item.itemWebUrl ?? null,
    marketplace: 'eBay'
  }));
}
