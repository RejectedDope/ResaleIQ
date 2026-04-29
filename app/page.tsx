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
  const recoveryScore = Math.round(
    analyses.reduce((sum, row) => sum + (row.analysis.complianceScore + row.analysis.profitScore + row.analysis.visibilityScore - row.analysis.deadListingRisk.riskScore / 2), 0) / total
  );
  const urgent = [...analyses].sort((a, b) => b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore).slice(0, 3);

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-[36px] border border-[#29204E] bg-[#070A18] text-white shadow-2xl">
        <div className="grid gap-10 p-7 md:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
          <div className="flex flex-col justify-center">
            <div className="w-fit rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#D5CAFF]">
              AI-Powered Recovery Intelligence
            </div>
            <h1 className="mt-7 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
              Stop Losing
              <br />
              Profit to Dead
              <br />
              <span className="text-[#8B5CFF]">Inventory.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
              ResaleIQ helps resellers find trapped revenue, expose weak margins, and decide whether to sell, hold, reprice, crosslist, bundle, or liquidate.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="/dead-listings" className="rounded-2xl bg-[#7C5CFF] px-6 py-3 font-bold text-white shadow-lg shadow-[#7C5CFF]/25">
                Find Dead Inventory
              </a>
              <a href="/analyze" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white">
                Analyze Item
              </a>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#11172E] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Recovery Dashboard</p>
                <p className="text-xs text-slate-400">Live MVP sample data</p>
              </div>
              <div className="rounded-full bg-[#7AF59A]/15 px-3 py-1 text-xs font-bold text-[#7AF59A]">Score {recoveryScore}/100</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Recoverable Revenue</p>
                <p className="mt-3 text-3xl font-extrabold text-[#7AF59A]">${recoverableRevenue.toFixed(0)}</p>
              </div>
              <div className="rounded-3xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Profit Leaks</p>
                <p className="mt-3 text-3xl font-extrabold text-[#C59BFF]">${profitLeaks.toFixed(0)}</p>
              </div>
              <div className="rounded-3xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">High Risk</p>
                <p className="mt-3 text-3xl font-extrabold text-[#FF8A8A]">{highRisk}</p>
              </div>
              <div className="rounded-3xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Dead Alerts</p>
                <p className="mt-3 text-3xl font-extrabold text-[#FFD36B]">{deadAlerts}</p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-[#1A223F] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
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
        <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Decision Engine</p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Know what to do next.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Every item gets a direct action: Relist, Reprice, Crosslist, Bundle, Hold, or Donate/Liquidate.</p>
        </div>
        <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Margin Protection</p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Stop selling at fake profit.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Fees, shipping, refund reserve, weak pricing, and stale inventory risk are exposed before you waste more time.</p>
        </div>
        <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Recovery Loop</p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Fix inventory before sourcing.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">The system prioritizes trapped money already sitting on your shelf instead of pushing more listing activity.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Immediate Recovery Queue</p>
            <h3 className="mt-1 text-2xl font-bold text-ink">Fix these before listing anything new</h3>
          </div>
          <a href="/dead-listings" className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">Open Recovery Room</a>
        </div>
        <div className="mt-5 grid gap-3">
          {urgent.map(({ item, analysis }) => (
            <div key={item.title} className="rounded-2xl border border-tan/80 bg-ivory p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.platform} • {item.listingAgeDays} days • ${item.targetSalePrice.toFixed(0)}</p>
                  <p className="mt-2 text-sm text-slate-700">Issue: {analysis.deadListingRisk.topIssue}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                  <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-white">{analysis.deadListingRisk.recommendedAction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
