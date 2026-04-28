import type { ProfitInput, ProfitResult } from '@/types'

export function calculateProfit(input: ProfitInput): ProfitResult {
  const grossSale = input.salePrice + input.shippingCharged
  const platformFee = input.salePrice * (input.platformFeePercent / 100)
  const promotedFee = input.salePrice * (input.promotedFeePercent / 100)
  const refundReserve = input.salePrice * (input.refundReservePercent / 100)
  const totalFees = platformFee + promotedFee + refundReserve

  const netProfit =
    grossSale -
    input.purchaseCost -
    input.shippingPaid -
    input.packagingCost -
    totalFees

  const roi = input.purchaseCost > 0 ? (netProfit / input.purchaseCost) * 100 : 0
  const margin = grossSale > 0 ? (netProfit / grossSale) * 100 : 0
  const breakEvenPrice = input.purchaseCost + input.shippingPaid + input.packagingCost

  return {
    grossSale,
    totalFees,
    netProfit,
    roi,
    margin,
    breakEvenPrice,
    weakProfit: netProfit < 15 || margin < 20
  }
}
