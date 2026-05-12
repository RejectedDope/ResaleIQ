import { ResaleIQCompResult } from '../ebay/types';

export type CompAnalysisResult = {
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  sampleSize: number;
  recommendedPrice: number;
};

export function analyzeComps(comps: ResaleIQCompResult[]): CompAnalysisResult {
  const prices = comps
    .map((item) => item.price)
    .filter((price): price is number => typeof price === 'number');

  if (prices.length === 0) {
    return {
      averagePrice: 0,
      lowestPrice: 0,
      highestPrice: 0,
      sampleSize: 0,
      recommendedPrice: 0
    };
  }

  const total = prices.reduce((sum, value) => sum + value, 0);
  const averagePrice = Number((total / prices.length).toFixed(2));
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);

  return {
    averagePrice,
    lowestPrice,
    highestPrice,
    sampleSize: prices.length,
    recommendedPrice: Number((averagePrice * 0.98).toFixed(2))
  };
}
