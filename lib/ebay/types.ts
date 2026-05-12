export type EbayEnvironment = 'sandbox' | 'production';

export type EbayAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: 'Application Access Token' | 'User Access Token' | string;
};

export type EbayBrowseSearchParams = {
  query: string;
  categoryIds?: string[];
  limit?: number;
  offset?: number;
  filter?: string;
  sort?: string;
};

export type EbayBrowseItemSummary = {
  itemId: string;
  title: string;
  price?: {
    value: string;
    currency: string;
  };
  itemWebUrl?: string;
  image?: {
    imageUrl: string;
  };
  seller?: {
    username?: string;
    feedbackScore?: number;
    feedbackPercentage?: string;
  };
  condition?: string;
  categories?: Array<{
    categoryId: string;
    categoryName: string;
  }>;
};

export type EbayBrowseSearchResponse = {
  href?: string;
  total?: number;
  next?: string;
  limit?: number;
  offset?: number;
  itemSummaries?: EbayBrowseItemSummary[];
};

export type ResaleIQCompResult = {
  title: string;
  price: number | null;
  currency: string | null;
  condition: string | null;
  imageUrl: string | null;
  itemUrl: string | null;
  marketplace: 'eBay';
};
