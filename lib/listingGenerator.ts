import { ListingAnalysis, ListingInput } from './types';
import { evaluateCompliance } from './compliance';
import { calculateProfit, calculateProfitScore } from './profit';
import { recommendPlatform, platformMismatch } from './platformRecommendation';
import { evaluateDeadListingRisk } from './deadListing';

function buildTitle(parts: string[], max: number): string {
  const text = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
}

export function analyzeListing(input: ListingInput): ListingAnalysis {
  const compliance = evaluateCompliance(input);
  const bestPlatform = recommendPlatform(input);
  const mismatch = platformMismatch(input, bestPlatform);

  const profitResult = calculateProfit({
    purchaseCost: input.purchaseCost,
    salePrice: input.targetSalePrice,
    platformFeePercent: input.platform.toLowerCase() === 'ebay' ? 13.5 : 10,
    promotedFeePercent: 4,
    shippingPaid: input.shippingPaid,
    shippingCharged: input.shippingCharged,
    packagingCost: 1.25,
    refundReservePercent: 2,
  });

  const profitScore = calculateProfitScore(profitResult);
  const visibilityScore = Math.max(
    0,
    Math.min(100, Math.round((input.title.length >= 45 ? 35 : 20) + compliance.complianceScore * 0.35 + (mismatch ? -10 : 10))),
  );

  const deadListingRisk = evaluateDeadListingRisk({
    input,
    complianceScore: compliance.complianceScore,
    profitScore,
    platformMismatch: mismatch,
  });

  const fastSalePrice = input.targetSalePrice * 0.85;
  const recommendedListingPrice = input.targetSalePrice;
  const maxValuePrice = input.targetSalePrice * 1.2;

  const ebayTitle = buildTitle(
    [input.brand, input.title, input.category, input.size ? `Size ${input.size}` : '', input.color],
    80,
  );
  const poshmarkTitle = buildTitle([input.brand, input.title, input.size, input.color], 60);
  const facebookTitle = buildTitle([input.title, input.condition, input.category], 70);

  const description = `${input.brand || 'Unbranded'} ${input.category} in ${input.condition || 'used'} condition. ` +
    `${input.color ? `Color: ${input.color}. ` : ''}` +
    `${input.material ? `Material: ${input.material}. ` : ''}` +
    `Ships fast. Notes: ${input.notes || 'No additional notes.'}`;

  const keywords = [input.brand, input.category, input.color, input.material, input.size, input.condition]
    .filter(Boolean)
    .map((k) => k.toLowerCase());

  const fixRecommendations = [
    ...compliance.requiredFixes,
    mismatch ? `Consider moving this listing to ${bestPlatform.platform}.` : 'Platform selection aligns with category.',
    deadListingRisk.riskLevel !== 'Low' ? 'Refresh photos and update first 5 title words.' : 'Maintain current listing with minor edits.',
  ];

  return {
    complianceScore: compliance.complianceScore,
    profitScore,
    visibilityScore,
    deadListingRisk,
    recommendedListingPrice,
    fastSalePrice,
    maxValuePrice,
    bestPlatform,
    ebayTitle,
    poshmarkTitle,
    facebookTitle,
    description,
    keywords,
    fixRecommendations,
  };
}
