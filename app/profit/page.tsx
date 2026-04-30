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
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Margin Protection</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Find fake profit before it becomes dead inventory.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          The profit calculator exposes fee drag, shipping leakage, refund reserve, break-even pressure, and weak-margin risk in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="rounded-2xl border border-tan bg-white p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setResult(calculateProfit(input));
          }}
        >
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Unit Economics</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Margin inputs</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(Object.keys(INITIAL) as (keyof ProfitInput)[]).map((field) => (
              <label key={field} className="text-sm font-bold capitalize text-slate-700">
                {field.replace(/([A-Z])/g, ' $1')}
                <input type="number" min={0} step="0.01" value={input[field]} onChange={(e) => setInput((p) => ({ ...p, [field]: Number(e.target.value) }))} />
              </label>
            ))}
          </div>
          <button className="mt-6 w-full bg-[#070A18] text-white hover:bg-[#2B185F]">Calculate Protected Margin</button>
        </form>

        {result ? <ProfitBreakdown result={result} /> : null}
      </div>
    </section>
  );
}
