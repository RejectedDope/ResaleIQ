import { DeadListingResult, ListingInput } from './types';

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export function evaluateDeadListingRisk(args: {
  input: ListingInput;
  complianceScore: number;
  profitScore: number;
  platformMismatch: boolean;
}): DeadListingResult {
  let riskScore = 0;
  const issues: string[] = [];
  const category = args.input.category.toLowerCase();
  const titleLength = args.input.title.trim().length;
  const lowTicket = args.input.targetSalePrice < 25;
  const veryStale = args.input.listingAgeDays > 90;
  const stale = args.input.listingAgeDays > 60;
  const weakProfit = args.profitScore < 50;
  const badProfit = args.profitScore < 35;
  const complianceWeak = args.complianceScore < 70;
  const regulatedRisk = includesAny(category, ['children', 'import', 'toy']) && !args.input.safetyDocs;
  const collectibleWrongPlatform = includesAny(category, ['coin', 'collectible', 'vintage']) && args.platformMismatch;
  const bulkyWrongPlatform = includesAny(category, ['furniture', 'local', 'bulky']) && args.platformMismatch;

  if (stale) {
    riskScore += 25;
    issues.push('Listing age exceeds 60 days');
  }

  if (args.input.listingAgeDays > 120) {
    riskScore += 10;
    issues.push('Listing is extremely stale');
  }

  if (complianceWeak) {
    riskScore += 20;
    issues.push('Compliance score below 70');
  }

  if (weakProfit) {
    riskScore += 15;
    issues.push('Profit score below 50');
  }

  if (titleLength < 45) {
    riskScore += 15;
    issues.push('Title length is under 45 characters');
  }

  if (!args.input.condition.trim()) {
    riskScore += 10;
    issues.push('Condition missing');
  }

  if (args.platformMismatch) {
    riskScore += 10;
    issues.push('Current platform appears mismatched');
  }

  if (regulatedRisk) {
    riskScore += 15;
    issues.push('Regulated category lacks safety documentation');
  }

  const riskLevel: DeadListingResult['riskLevel'] = riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';

  let recommendedAction: DeadListingResult['recommendedAction'] = 'Hold';

  if ((badProfit && veryStale) || (regulatedRisk && weakProfit) || (lowTicket && veryStale && weakProfit)) {
    recommendedAction = 'Donate/Liquidate';
  } else if (lowTicket || includesAny(category, ['bundle', 'jewelry lot', 'beauty', 'skincare'])) {
    recommendedAction = 'Bundle';
  } else if (collectibleWrongPlatform || bulkyWrongPlatform || args.platformMismatch) {
    recommendedAction = 'Crosslist';
  } else if (stale && weakProfit) {
    recommendedAction = 'Reprice';
  } else if (stale || complianceWeak || titleLength < 45) {
    recommendedAction = 'Relist';
  } else if (args.profitScore >= 70 && args.input.listingAgeDays <= 45) {
    recommendedAction = 'Hold';
  }

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    topIssue: issues[0] ?? 'No major issue detected',
    recommendedAction,
  };
}
