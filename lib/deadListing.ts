import { DeadListingResult, LifecycleStage, ListingInput, RiskTier } from './types';

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

function ctrStatus(ctr: number): DeadListingResult['ctrStatus'] {
  if (ctr < 0.5) return 'Critical';
  if (ctr < 1) return 'Weak';
  return 'Healthy';
}

function decayTier(score: number): RiskTier {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MODERATE';
  return 'LOW';
}

function lifecycle(args: { age: number; daysSinceSale: number; decay: number; recoveryProbability: number }): LifecycleStage {
  if (args.decay >= 85 && args.daysSinceSale > 45) return 'Dead Inventory';
  if (args.decay >= 75 && args.recoveryProbability < 35) return 'Liquidation Candidate';
  if (args.decay >= 60) return 'Recovery Candidate';
  if (args.decay >= 45) return 'Decaying';
  if (args.age > 45 || args.daysSinceSale > 10) return 'Slowing';
  if (args.age > 14) return 'Active';
  return 'Fresh';
}

export function evaluateDeadListingRisk(args: { input: ListingInput; complianceScore: number; profitScore: number; platformMismatch: boolean }): DeadListingResult {
  const i = args.input;
  const ctr = i.impressions > 0 ? (i.clicks / i.impressions) * 100 : 0;
  const ctrState = ctrStatus(ctr);
  const impressionDrop = clamp(-i.impressionTrend7d);

  const decayScore = clamp(
    impressionDrop * 0.32 +
      clamp(100 - ctr * 28) * 0.2 +
      clamp(i.daysSinceEngagement * 2.2) * 0.14 +
      clamp(i.daysSinceSale * 1.7) * 0.14 +
      clamp(i.listingAgeDays * 0.6) * 0.1 +
      clamp(i.adPerformanceDecline) * 0.1,
  );

  const exposureScore = clamp(100 - (impressionDrop * 0.5 + clamp(100 - ctr * 30) * 0.35 + clamp(i.daysSinceEngagement * 2) * 0.15));

  const listingHealthScore = clamp(
    exposureScore * 0.28 +
      clamp(ctr * 35) * 0.2 +
      clamp(i.salesCount * 20) * 0.12 +
      i.pricingCompetitiveness * 0.1 +
      i.itemSpecificsCompleteness * 0.1 +
      i.titleOptimization * 0.1 +
      i.imageQuality * 0.1,
  );

  const recoveryProbability = clamp(100 - decayScore + (args.profitScore - 50) * 0.4);
  const stage = lifecycle({ age: i.listingAgeDays, daysSinceSale: i.daysSinceSale, decay: decayScore, recoveryProbability });

  const problems: string[] = [];
  if (impressionDrop > 70) problems.push('Impression collapse (>70%)');
  if (ctrState !== 'Healthy') problems.push(`CTR is ${ctrState.toLowerCase()} (${ctr.toFixed(2)}%)`);
  if (i.daysSinceSale > 30) problems.push('No sale in over 30 days');
  if (i.daysSinceEngagement > 14) problems.push('Engagement is stale');
  if (args.platformMismatch) problems.push('Marketplace/platform mismatch likely suppressing reach');

  const recommendedActions = [
    'End and relist with a fresh hero image',
    'Rewrite title for stronger keyword relevance',
    'Improve item specifics and condition detail',
  ];
  if (ctr < 1) recommendedActions.push('Replace cover image and run A/B image test');
  if (i.pricingCompetitiveness < 60) recommendedActions.push('Adjust price to competitive range');
  if (args.platformMismatch) recommendedActions.push('Crosslist to a stronger marketplace');
  if (stage === 'Liquidation Candidate') recommendedActions.push('Move to liquidation workflow');

  let recommendedAction: DeadListingResult['recommendedAction'] = 'Hold';
  if (stage === 'Liquidation Candidate' || stage === 'Dead Inventory') recommendedAction = 'Donate/Liquidate';
  else if (args.platformMismatch) recommendedAction = 'Crosslist';
  else if (ctr < 0.5) recommendedAction = 'Relist';
  else if (i.pricingCompetitiveness < 60) recommendedAction = 'Reprice';

  const riskScore = Math.round(decayScore);
  const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';

  return {
    riskScore,
    riskLevel,
    topIssue: problems[0] ?? 'No major issue detected',
    recommendedAction,
    ctr,
    ctrStatus: ctrState,
    listingHealthScore: Math.round(listingHealthScore),
    exposureScore: Math.round(exposureScore),
    decayScore: Math.round(decayScore),
    decayTier: decayTier(decayScore),
    lifecycleStage: stage,
    recoveryPriority: Math.round(clamp(decayScore + (100 - recoveryProbability) * 0.4)),
    recoveryProbability: Math.round(recoveryProbability),
    majorProblems: problems,
    recommendedActions,
  };
}
