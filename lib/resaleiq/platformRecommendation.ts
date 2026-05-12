export type PlatformRecommendationInput = {
  category: string;
  price: number;
  luxury?: boolean;
  vintage?: boolean;
  bulky?: boolean;
};

export function recommendMarketplace(input: PlatformRecommendationInput) {
  if (input.luxury) {
    return ['eBay', 'Poshmark', 'The RealReal'];
  }

  if (input.vintage) {
    return ['eBay', 'Etsy', 'Whatnot'];
  }

  if (input.bulky) {
    return ['Facebook Marketplace'];
  }

  if (input.price < 25) {
    return ['Mercari', 'Vinted'];
  }

  return ['eBay', 'Poshmark', 'Mercari'];
}
