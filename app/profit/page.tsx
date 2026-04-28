'use client';

import { useState } from 'react';
import { ProfitBreakdown } from '@/components/ProfitBreakdown';
import { calculateProfit } from '@/lib/profit';
import { ProfitInput, ProfitResult } from '@/lib/types';

const INITIAL: ProfitInput = {
  purchaseCost: 10,
  salePrice: 35,
  platformFeePercent: 13.5,
  promotedFeePercent: 4,
  shippingPaid: 7,
  shippingCharged: 7,
  packagingCost: 1.25,
  refundReservePercent: 2,
};

export default function ProfitPage() {
  const [input, setInput] = useState<ProfitInput>(INITIAL);
  const [result, setResult] = useState<ProfitResult | null>(calculateProfit(INITIAL));

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Profit Calculator</h2>
      <form
        className="grid grid-cols-1 gap-3 rounded-xl border border-tan bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(calculateProfit(input));
        }}
      >
        {(Object.keys(INITIAL) as (keyof ProfitInput)[]).map((field) => (
          <label key={field} className="text-sm capitalize">
            {field.replace(/([A-Z])/g, ' $1')}
            <input
              type="number"
              min={0}
              step="0.01"
              value={input[field]}
              onChange={(e) => setInput((p) => ({ ...p, [field]: Number(e.target.value) }))}
            />
          </label>
        ))}
        <button className="bg-clay text-white md:col-span-2">Calculate Profit</button>
      </form>

      {result ? <ProfitBreakdown result={result} /> : null}
    </section>
  );
}
