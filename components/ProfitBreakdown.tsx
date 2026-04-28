import React from 'react';
import { ProfitResult } from '@/lib/types';

export function ProfitBreakdown({ result }: { result: ProfitResult }) {
  const currency = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="rounded-xl border border-tan bg-white p-4">
      <h3 className="mb-3 font-semibold">Profit Breakdown</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <p>Gross Sale</p>
        <p className="text-right">{currency(result.grossSale)}</p>
        <p>Total Fees</p>
        <p className="text-right">{currency(result.totalFees)}</p>
        <p>Net Profit</p>
        <p className="text-right font-semibold">{currency(result.netProfit)}</p>
        <p>ROI</p>
        <p className="text-right">{result.roi.toFixed(1)}%</p>
        <p>Margin</p>
        <p className="text-right">{result.margin.toFixed(1)}%</p>
        <p>Break-even Price</p>
        <p className="text-right">{currency(result.breakEvenPrice)}</p>
      </div>
      {result.weakProfitWarning ? (
        <p className="mt-3 rounded-lg bg-orange-100 px-3 py-2 text-xs text-orange-800">Warning: profit is weak, consider repricing or cost cuts.</p>
      ) : null}
    </div>
  );
}
