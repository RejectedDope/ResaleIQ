import { ListingInput, PlatformRecommendation } from './types';

const PLATFORM_MAP: PlatformRecommendation[] = [
  { platform: 'eBay', score: 80, reason: 'Strong search demand and broad buyer base.' },
  { platform: 'Poshmark', score: 72, reason: 'Great for fashion and social reselling.' },
  { platform: 'Facebook Marketplace', score: 66, reason: 'Fast local sales and low friction.' },
  { platform: 'Mercari', score: 68, reason: 'Good for value inventory with quick turnover.' },
];

export function recommendPlatform(input: ListingInput): PlatformRecommendation {
  const category = input.category.toLowerCase();
  const candidates = PLATFORM_MAP.map((p) => ({ ...p }));

  for (const candidate of candidates) {
    if (category.includes('fashion') || category.includes('apparel')) {
      if (candidate.platform === 'Poshmark') candidate.score += 18;
      if (candidate.platform === 'eBay') candidate.score += 8;
    }

    if (category.includes('electronics') || category.includes('collectible') || category.includes('coin')) {
      if (candidate.platform === 'eBay') candidate.score += 20;
    }

    if (input.listingAgeDays > 60 && candidate.platform === 'Facebook Marketplace') {
      candidate.score += 8;
    }
  }

  return candidates.sort((a, b) => b.score - a.score)[0];
}

export function platformMismatch(input: ListingInput, best: PlatformRecommendation): boolean {
  return input.platform.trim().toLowerCase() !== best.platform.toLowerCase();
}
