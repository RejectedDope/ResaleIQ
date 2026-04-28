'use client'

import { useState } from 'react'
import ProfitBreakdown from '@/components/ProfitBreakdown'
import { calculateProfit } from '@/lib/profit'

export default function ProfitPage() {
  const [input, setInput] = useState({
    purchaseCost: 22,
    salePrice: 85,
    platformFeePercent: 13.25,
    promotedFeePercent: 5,
    shippingPaid: 9,
    shippingCharged: 7,
    packagingCost: 1.5,
    refundReservePercent: 3
  })

  const result = calculateProfit(input)

  function updateField(field: string, value: string) {
    setInput({ ...input, [field]: Number(value) })
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#1A1714]">Profit Calculator</h1>
        <p className="mt-2 text-[#5C5449]">Calculate real resale profit after cost, fees, shipping, packaging, and refund reserve.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-[#E2DDD5] bg-white p-5">
            <div className="grid gap-4">
              {Object.entries(input).map(([key, value]) => (
                <label key={key} className="grid gap-1 text-sm font-medium text-[#1A1714]">
                  {key.replace(/([A-Z])/g, ' $1')}
                  <input
                    className="rounded-xl border border-[#E2DDD5] p-3"
                    type="number"
                    value={value}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <ProfitBreakdown {...result} />
            <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5">
              <p>Margin: {result.margin.toFixed(1)}%</p>
              <p>Break-even Price: ${result.breakEvenPrice.toFixed(2)}</p>
              {result.weakProfit ? <p className="mt-3 font-semibold text-red-700">Warning: weak profit. Reprice, reduce fees, or skip this item.</p> : <p className="mt-3 font-semibold text-green-700">Profit profile looks usable.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
