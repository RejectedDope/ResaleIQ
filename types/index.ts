export type ListingInput = {
  itemTitle: string
  brand?: string
  category: string
  condition?: string
  size?: string
  color?: string
  material?: string
  purchaseCost: number
  targetSalePrice: number
  shippingPaid: number
  shippingCharged: number
  platform: string
  listingAgeDays: number
  notes?: string
}

export type ComplianceResult = {
  score: number
  riskLevel: 'Low' | 'Medium' | 'High'
  missingFields: string[]
  requiredFixes: string[]
  explanation: string
}

export type ProfitInput = {
  purchaseCost: number
  salePrice: number
  platformFeePercent: number
  promotedFeePercent: number
  shippingPaid: number
  shippingCharged: number
  packagingCost: number
  refundReservePercent: number
}

export type ProfitResult = {
  grossSale: number
  totalFees: number
  netProfit: number
  roi: number
  margin: number
  breakEvenPrice: number
  weakProfit: boolean
}
