import { DeadListingResult, ListingInput } from './types';

export function evaluateDeadListingRisk(args: {
  input: ListingInput;
  complianceScore: number;
  profitScore: number;
  platformMismatch: boolean;
}): DeadListingResult {
  let riskScore = 0;
  const issues: string[] = [];

  if (args.input.listingAgeDays > 60) {
    riskScore += 25;
    issues.push('Listing age exceeds 60 days');
  }

  if (args.complianceScore < 70) {
    riskScore += 20;
    issues.push('Compliance score below 70');
  }

  if (args.profitScore < 50) {
    riskScore += 15;
    issues.push('Profit score below 50');
  }

  if (args.input.title.trim().length < 45) {
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

  const riskLevel: DeadListingResult['riskLevel'] = riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';

  const recommendedAction: DeadListingResult['recommendedAction'] =
    riskLevel === 'High'
      ? args.profitScore < 40
        ? 'Donate/Liquidate'
        : 'Relist'
      : riskLevel === 'Medium'
        ? args.input.listingAgeDays > 90
          ? 'Reprice'
          : 'Crosslist'
        : args.profitScore > 75
          ? 'Hold'
          : 'Bundle';

  return {
    riskScore,
    riskLevel,
    topIssue: issues[0] ?? 'No major issue detected',
    recommendedAction,
  };
}
