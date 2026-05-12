export type PlatformFeeInput = {
  salePrice: number;
  shippingCharged?: number;
  itemCost?: number;
  shippingCost?: number;
  marketplace?: 'ebay' | 'poshmark' | 'mercari' | 'facebook' | 'vinted';
};

export type PlatformFeeResult = {
  marketplace: string;
  salePrice: number;
  estimatedFees: number;
  estimatedNet: number;
  estimatedProfit: number | null;
  marginPercent: number | null;
};

const feeRates: Record<string, number> = {
  ebay: 0.1325,
  poshmark: 0.2,
  mercari: 0.1,
  facebook: 0.05,
  vinted: 0
};

export function calculatePlatformFees(input: PlatformFeeInput): PlatformFeeResult {
  const marketplace = input.marketplace ?? 'ebay';
  const gross = input.salePrice + (input.shippingCharged ?? 0);
  const rate = feeRates[marketplace] ?? feeRates.ebay;
  const estimatedFees = Number((gross * rate).toFixed(2));
  const estimatedNet = Number((gross - estimatedFees - (input.shippingCost ?? 0)).toFixed(2));
  const estimatedProfit = input.itemCost === undefined ? null : Number((estimatedNet - input.itemCost).toFixed(2));
  const marginPercent = estimatedProfit === null || gross === 0 ? null : Number(((estimatedProfit / gross) * 100).toFixed(1));

  return {
    marketplace,
    salePrice: input.salePrice,
    estimatedFees,
    estimatedNet,
    estimatedProfit,
    marginPercent
  };
}
