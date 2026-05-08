export type ListingInput = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  size: string;
  color: string;
  material: string;
  purchaseCost: number;
  targetSalePrice: number;
  shippingPaid: number;
  shippingCharged: number;
  platform: string;
  listingAgeDays: number;
  notes: string;
  safetyDocs: boolean;
  gradingDescriptors: boolean;
  impressions: number;
  clicks: number;
  salesCount: number;
  daysSinceEngagement: number;
  daysSinceSale: number;
  impressionTrend7d: number;
  adPerformanceDecline: number;
  pricingCompetitiveness: number;
  itemSpecificsCompleteness: number;
  titleOptimization: number;
  imageQuality: number;
};

export type PlatformRecommendation = { platform: string; score: number; reason: string };
export type ComplianceResult = { complianceScore: number; riskLevel: 'Low' | 'Medium' | 'High'; missingFields: string[]; requiredFixes: string[]; explanation: string };
export type ProfitInput = { purchaseCost: number; salePrice: number; platformFeePercent: number; promotedFeePercent: number; shippingPaid: number; shippingCharged: number; packagingCost: number; refundReservePercent: number };
export type ProfitResult = { grossSale: number; totalFees: number; netProfit: number; roi: number; margin: number; breakEvenPrice: number; weakProfitWarning: boolean };

export type LifecycleStage = 'Fresh' | 'Active' | 'Slowing' | 'Decaying' | 'Dead Inventory' | 'Recovery Candidate' | 'Liquidation Candidate';
export type RiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DeadListingResult = {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  topIssue: string;
  recommendedAction: 'Relist' | 'Reprice' | 'Crosslist' | 'Bundle' | 'Hold' | 'Donate/Liquidate';
  ctr: number;
  ctrStatus: 'Healthy' | 'Weak' | 'Critical';
  listingHealthScore: number;
  exposureScore: number;
  decayScore: number;
  decayTier: RiskTier;
  lifecycleStage: LifecycleStage;
  recoveryPriority: number;
  recoveryProbability: number;
  majorProblems: string[];
  recommendedActions: string[];
};

export type ListingAnalysis = {
  complianceScore: number;
  profitScore: number;
  visibilityScore: number;
  deadListingRisk: DeadListingResult;
  recommendedListingPrice: number;
  fastSalePrice: number;
  maxValuePrice: number;
  bestPlatform: PlatformRecommendation;
  ebayTitle: string;
  poshmarkTitle: string;
  facebookTitle: string;
  description: string;
  keywords: string[];
  fixRecommendations: string[];
};
