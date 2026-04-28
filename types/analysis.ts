export type AnalysisResult = {
  complianceScore: number
  profitScore: number
  visibilityScore: number
  bestPlatform: string
  fastSalePrice: number
  balancedPrice: number
  maxValuePrice: number
  recommendations: string[]
}

export type DeadInventoryAuditOffer = {
  title: string
  startingPrice: number
  primaryOutcome: string
  actionsIncluded: string[]
}
