import { RiskBadge } from '@/components/RiskBadge';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

export default function DashboardPage() {
  const analyses = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));
  const total = analyses.length || 1;
  const highRisk = analyses.filter((row) => row.analysis.deadListingRisk.riskLevel === 'High').length;
  const deadAlerts = analyses.filter((row) => row.analysis.deadListingRisk.riskScore >= 60).length;
  const recoverableRevenue = analyses.reduce((sum, row) => sum + row.item.targetSalePrice, 0);
  const profitLeaks = analyses.reduce((sum, row) => sum + (row.item.listingAgeDays > 60 ? row.item.targetSalePrice * 0.15 : 0), 0);
  const avgRoi = Math.round(
    analyses.reduce((sum, row) => sum + ((row.item.targetSalePrice - row.item.purchaseCost - row.item.shippingPaid) / Math.max(row.item.purchaseCost, 1)) * 100, 0) / total,
  );
  const recoveryScore = Math.round(
    analyses.reduce(
      (sum, row) => sum + (row.analysis.complianceScore + row.analysis.profitScore + row.analysis.visibilityScore - row.analysis.deadListingRisk.riskScore / 2),
      0,
    ) / total,
  );
  const urgent = [...analyses].sort((a, b) => b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore).slice(0, 4);

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-2xl border border-[#29204E] bg-[linear-gradient(135deg,#050713_0%,#10172F_48%,#2B185F_100%)] text-white shadow-2xl">
        <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
          <div className="flex flex-col justify-center">
            <div className="w-fit rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#D5CAFF]">
              Recovery Intelligence System
            </div>
            <div className="mt-7 rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#7AF59A]">You have</p>
              <p className="mt-2 text-6xl font-black leading-none tracking-tight text-[#7AF59A] md:text-8xl">${recoverableRevenue.toFixed(0)}</p>
              <p className="mt-3 text-2xl font-extrabold text-white md:text-3xl">in recoverable inventory</p>
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
              Stop losing money to inventory that should already be moving.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-300">
              ResaleIQ turns stale listings into money decisions: recover, reprice, crosslist, bundle, hold, or liquidate before more profit disappears.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="/dead-listings" className="rounded-2xl bg-[#7AF59A] px-6 py-3 font-extrabold text-[#070A18] shadow-lg shadow-[#7AF59A]/20 hover:bg-[#64DD83]">
                Recover Inventory Now
              </a>
              <a href="/analyze" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-extrabold text-white hover:bg-white/10">
                Fix One Item
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11172E]/95 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">Revenue Recovery Panel</p>
                <p className="text-xs text-slate-400">Simulated from MVP sample inventory</p>
              </div>
              <div className="rounded-full bg-[#7AF59A]/15 px-3 py-1 text-xs font-extrabold text-[#7AF59A]">Score {recoveryScore}/100</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Recoverable</p>
                <p className="mt-3 text-3xl font-extrabold text-[#7AF59A]">${recoverableRevenue.toFixed(0)}</p>
              </div>
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Profit Leaks</p>
                <p className="mt-3 text-3xl font-extrabold text-[#C59BFF]">${profitLeaks.toFixed(0)}</p>
              </div>
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">High Risk</p>
                <p className="mt-3 text-3xl font-extrabold text-[#FF8A8A]">{highRisk}</p>
              </div>
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Avg ROI</p>
                <p className="mt-3 text-3xl font-extrabold text-[#FFD36B]">{avgRoi}%</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#1A223F] p-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>Recovery Score</span>
                <span>{recoveryScore}/100</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#7C5CFF]" style={{ width: `${Math.max(5, Math.min(100, recoveryScore))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Decision Engine</p>
          <h2 className="mt-3 text-2xl font-extrabold text-ink">Tell me what to do right now.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Every item gets a direct money action: recover, reprice, crosslist, bundle, hold, or liquidate.</p>
        </div>
        <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Margin Protection</p>
          <h2 className="mt-3 text-2xl font-extrabold text-ink">Stop selling at fake profit.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">ROI, shipping leakage, refund reserve, weak pricing, and stale inventory risk are exposed before more time gets spent.</p>
        </div>
        <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Recovery Loop</p>
          <h2 className="mt-3 text-2xl font-extrabold text-ink">Fix inventory before sourcing.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">The system prioritizes trapped money already sitting on the shelf instead of pushing more listing activity.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Emergency Queue</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Fix these before listing anything new</h3>
          </div>
          <a href="/dead-listings" className="rounded-2xl bg-ink px-4 py-3 text-sm font-extrabold text-white hover:bg-[#2B185F]">Fix Now</a>
        </div>
        <div className="mt-5 grid gap-3">
          {urgent.map(({ item, analysis }) => (
            <div key={item.title} className="rounded-2xl border border-tan/80 bg-ivory p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.platform} - {item.listingAgeDays} days - ${item.targetSalePrice.toFixed(0)}</p>
                  <p className="mt-2 text-sm text-slate-700">Money blocker: {analysis.deadListingRisk.topIssue}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                  <span className="rounded-full bg-sage px-3 py-1 text-xs font-extrabold text-white">Fix Now: {analysis.deadListingRisk.recommendedAction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
