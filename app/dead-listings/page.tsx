import { RiskBadge } from '@/components/RiskBadge';
import { ScoreCard } from '@/components/ScoreCard';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

type InventoryItem = (typeof sampleInventory)[number];

function baseProfit(item: InventoryItem, price: number) {
  return price + item.shippingCharged - item.purchaseCost - item.shippingPaid;
}

function currentOutcome(item: InventoryItem, riskScore: number) {
  const riskDiscount = Math.min(0.3, riskScore * 0.003);
  const price = item.targetSalePrice * (1 - riskDiscount);
  const profit = baseProfit(item, price);
  return {
    price,
    profit,
    roi: Math.round((profit / Math.max(item.purchaseCost, 1)) * 100),
  };
}

function fixedOutcome(item: InventoryItem, action: string, riskScore: number) {
  const current = currentOutcome(item, riskScore);
  const liftByAction: Record<string, number> = {
    Relist: 0.08,
    Reprice: 0.06,
    Crosslist: 0.1,
    Bundle: 0.12,
    Hold: 0.03,
    'Donate/Liquidate': 0.04,
  };
  const lift = liftByAction[action] ?? 0.06;
  const price = Math.min(item.targetSalePrice * 1.12, current.price + item.targetSalePrice * lift);
  const profit = baseProfit(item, price);
  return {
    price,
    profit,
    roi: Math.round((profit / Math.max(item.purchaseCost, 1)) * 100),
    improvement: Math.max(0, profit - current.profit),
  };
}

export default function DeadListingsPage() {
  const rows = sampleInventory.map((item) => {
    const analysis = analyzeListing(item);
    const current = currentOutcome(item, analysis.deadListingRisk.riskScore);
    const fixed = fixedOutcome(item, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore);
    return { item, analysis, current, fixed };
  });
  const total = rows.length || 1;
  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.targetSalePrice, 0);
  const highRisk = rows.filter((row) => row.analysis.deadListingRisk.riskLevel === 'High').length;
  const recoveryScore = Math.round(rows.reduce((sum, row) => sum + (100 - row.analysis.deadListingRisk.riskScore), 0) / total);
  const emergencyQueue = [...rows].sort((a, b) => b.fixed.improvement - a.fixed.improvement).slice(0, 4);
  const itemsToFix = rows.filter((row) => row.analysis.deadListingRisk.riskScore >= 30).length;
  const itemsLeftAfterFirstFix = Math.max(0, itemsToFix - 1);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Recovery Room</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Fix the items costing you money right now.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Every row shows the current money outcome, the after-fix outcome, and the exact profit gap.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Progression</p>
            <p className="mt-2 text-5xl font-extrabold text-[#7AF59A]">{itemsToFix}</p>
            <p className="mt-1 text-sm font-bold text-slate-300">items to fix. Then {itemsLeftAfterFirstFix} left.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard title="Recoverable Revenue" value={`$${recoverableRevenue.toFixed(0)}`} helper="Potential revenue represented by current sample inventory." tone="success" />
        <ScoreCard title="Recovery Score" value={`${recoveryScore}/100`} helper="Higher means less dead-inventory pressure across the shelf." tone="dark" />
        <ScoreCard title="Fix Now Items" value={itemsToFix} helper="Simulated queue: one fix moves the count down immediately." tone={itemsToFix ? 'danger' : 'neutral'} />
      </div>

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Emergency Queue</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Do these first</h3>
          </div>
          <p className="text-sm font-semibold text-slate-600">Sorted by profit improvement</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {emergencyQueue.map(({ item, analysis, current, fixed }) => (
            <div key={item.title} className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{analysis.deadListingRisk.topIssue}</p>
                </div>
                <RiskBadge level={analysis.deadListingRisk.riskLevel} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Outcome</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">Price ${current.price.toFixed(0)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">ROI {current.roi}%</p>
                  <p className="mt-1 text-sm font-bold text-red-700">Risk {analysis.deadListingRisk.riskScore}</p>
                </div>
                <div className="rounded-2xl bg-[#070A18] p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix Outcome</p>
                  <p className="mt-2 text-sm font-bold">New price ${fixed.price.toFixed(0)}</p>
                  <p className="mt-1 text-sm font-bold">New ROI {fixed.roi}%</p>
                  <p className="mt-2 text-xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} more profit</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-[#070A18] p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Fix Now</p>
                <p className="mt-1 text-3xl font-extrabold">{analysis.deadListingRisk.recommendedAction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {rows.map(({ item, analysis, current, fixed }) => {
          const high = analysis.deadListingRisk.riskLevel === 'High';
          return (
            <div key={item.title} className={`rounded-2xl border p-5 shadow-sm ${high ? 'border-red-200 bg-red-50' : 'border-tan bg-white'}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Inventory Item</p>
                  <h3 className="mt-2 text-xl font-extrabold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-700">{item.platform} - {item.listingAgeDays} days - {analysis.deadListingRisk.topIssue}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                  <span className="rounded-full bg-[#070A18] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white">Fix Now: {analysis.deadListingRisk.recommendedAction}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr]">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Outcome</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm font-bold text-slate-700">
                    <span>Price ${current.price.toFixed(0)}</span>
                    <span>ROI {current.roi}%</span>
                    <span>Risk {analysis.deadListingRisk.riskScore}</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#070A18] p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix Outcome</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
                    <span>New price ${fixed.price.toFixed(0)}</span>
                    <span>New ROI {fixed.roi}%</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-sage p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Profit Gap</p>
                  <p className="mt-2 text-3xl font-extrabold">+${fixed.improvement.toFixed(0)}</p>
                  <p className="mt-1 text-sm font-bold">more profit if you fix this</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
