import { ProfitResult } from '@/lib/types';

export function ProfitBreakdown({ result }: { result: ProfitResult }) {
  const currency = (n: number) => `$${n.toFixed(2)}`;
  const rows = [
    ['Gross Sale', currency(result.grossSale)],
    ['Total Fees', currency(result.totalFees)],
    ['Net Profit', currency(result.netProfit)],
    ['ROI', `${result.roi.toFixed(1)}%`],
    ['Margin', `${result.margin.toFixed(1)}%`],
    ['Break-even Price', currency(result.breakEvenPrice)],
  ];

  return (
    <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Margin Protection</p>
          <h3 className="mt-1 text-2xl font-extrabold text-ink">Profit Breakdown</h3>
        </div>
        <div className={`rounded-2xl px-4 py-2 text-sm font-bold ${result.weakProfitWarning ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {result.weakProfitWarning ? 'Margin at risk' : 'Margin protected'}
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-ivory px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-extrabold text-ink">{value}</p>
          </div>
        ))}
      </div>
      {result.weakProfitWarning ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
          Warning: this item is selling at fake profit. Reprice, bundle, or cut handling costs before relisting.
        </p>
      ) : null}
    </div>
  );
}
