import { ProfitInput, ProfitResult } from './types';

export function calculateProfit(input: ProfitInput): ProfitResult {
  const grossSale = input.salePrice + input.shippingCharged;
  const platformFee = input.salePrice * (input.platformFeePercent / 100);
  const promotedFee = input.salePrice * (input.promotedFeePercent / 100);
  const refundReserve = input.salePrice * (input.refundReservePercent / 100);

  const netProfit =
    grossSale -
    input.purchaseCost -
    input.shippingPaid -
    input.packagingCost -
    platformFee -
    promotedFee -
    refundReserve;

  const roi = input.purchaseCost > 0 ? (netProfit / input.purchaseCost) * 100 : 0;
  const margin = grossSale > 0 ? (netProfit / grossSale) * 100 : 0;

  const breakEvenPrice =
    input.purchaseCost +
    input.shippingPaid +
    input.packagingCost +
    platformFee +
    promotedFee +
    refundReserve -
    input.shippingCharged;

  const totalFees = platformFee + promotedFee + refundReserve;

  return {
    grossSale,
    totalFees,
    netProfit,
    roi,
    margin,
    breakEvenPrice,
    weakProfitWarning: netProfit < 8 || margin < 15,
  };
}

export function calculateProfitScore(result: ProfitResult): number {
  const base = 50 + result.margin * 0.7 + result.roi * 0.2;
  return Math.max(0, Math.min(100, Math.round(base)));
}
