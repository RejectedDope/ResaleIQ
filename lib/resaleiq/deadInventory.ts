export type DeadInventoryInput = {
  daysListed: number;
  watchers?: number;
  views?: number;
  priceDrops?: number;
};

export type DeadInventoryResult = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  recommendations: string[];
};

export function evaluateDeadInventory(input: DeadInventoryInput): DeadInventoryResult {
  let score = 0;

  if (input.daysListed > 30) score += 25;
  if (input.daysListed > 60) score += 25;
  if (input.daysListed > 90) score += 25;

  if ((input.watchers ?? 0) < 2) score += 10;
  if ((input.views ?? 0) < 20) score += 10;
  if ((input.priceDrops ?? 0) > 2) score += 10;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

  if (score >= 40) riskLevel = 'MEDIUM';
  if (score >= 70) riskLevel = 'HIGH';

  const recommendations: string[] = [];

  if (riskLevel !== 'LOW') {
    recommendations.push('Review title SEO');
    recommendations.push('Refresh photos');
    recommendations.push('Consider Sell Similar');
    recommendations.push('Cross-list to additional marketplaces');
  }

  if (score >= 70) {
    recommendations.push('Consider liquidation pricing');
  }

  return {
    riskLevel,
    score,
    recommendations
  };
}
