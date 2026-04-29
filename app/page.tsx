import { ScoreCard } from '@/components/ScoreCard';
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
  const avgHealth = analyses.reduce((sum, row) => sum + (row.analysis.complianceScore + row.analysis.profitScore + row.analysis.visibilityScore) / 3, 0) / total;
  const urgent = [...analyses].sort((a, b) => b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore).slice(0, 3);

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-[#2b2157] bg-gradient-to-br from-[#050816] via-[#0B1026] to-[#1B1240] text-white shadow-2xl">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:p-10">
          <div>
            <p className="inline-block rounded-full bg-[#6D42FF]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#C5B4FF]">
              Margin Protection • Dead Inventory Recovery System
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Recover More Profit.<br />
              Stop Leaving <span className="text-[#8B5CFF]">Money</span><br />
              <span className="text-[#8B5CFF]">on the Shelf.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              ResaleIQ tells you the truth about every listing so you know exactly what to sell, hold, reprice, or liquidate before profit disappears.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-xl bg-[#6D42FF] px-6 py-3 font-semibold text-white">Start Free Trial</button>
              <button className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white">See How It Works</button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#11172E] p-5 shadow-xl">
            <p className="mb-4 text-sm font-semibold text-white">Dashboard</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Recoverable Revenue</p>
                <p className="mt-2 text-2xl font-bold text-[#7AF59A]">${recoverableRevenue.toFixed(0)}</p>
              </div>
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">High-Risk Listings</p>
                <p className="mt-2 text-2xl font-bold text-[#FF7A7A]">{highRisk}</p>
              </div>
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Dead Inventory Alerts</p>
                <p className="mt-2 text-2xl font-bold text-[#FFD36B]">{deadAlerts}</p>
              </div>
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Profit Leaks</p>
                <p className="mt-2 text-2xl font-bold text-[#B68BFF]">${profitLeaks.toFixed(0)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-[#1A223F] p-4">
              <p className="text-xs text-slate-400">Average Listing Health</p>
              <p className="mt-2 text-3xl font-bold">{avgHealth.toFixed(0)}/100</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <ScoreCard title="Know What To Do" value="Instant" helper="Sell, Hold, Reprice, or Liquidate" />
        <ScoreCard title="Recover Dead Inventory" value={`${deadAlerts}`} helper="Find hidden profit in stale listings" />
        <ScoreCard title="Stay Compliant" value="Real-Time" helper="Avoid policy violations" />
        <ScoreCard title="Protect Your Margin" value={`${avgHealth.toFixed(0)}%`} helper="Accurate fee + profit calculations" />
      </div>

      <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-ink">Immediate Recovery Queue</h3>
        <div className="mt-5 grid gap-3">
          {urgent.map(({ item, analysis }) => (
            <div key={item.title} className="rounded-2xl border border-tan/80 bg-ivory p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.platform} • {item.listingAgeDays} days • ${item.targetSalePrice.toFixed(0)}</p>
                  <p className="mt-2 text-sm text-slate-700">{analysis.deadListingRisk.topIssue}</p>
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
