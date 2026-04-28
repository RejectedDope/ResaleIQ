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
  const profitLeaks = analyses.reduce((sum, row) => {
    const stalePenalty = row.item.listingAgeDays > 60 ? row.item.targetSalePrice * 0.15 : 0;
    const weakProfitPenalty = row.analysis.profitScore < 50 ? row.item.targetSalePrice * 0.1 : 0;
    return sum + stalePenalty + weakProfitPenalty;
  }, 0);
  const avgHealth = analyses.reduce((sum, row) => sum + (row.analysis.complianceScore + row.analysis.profitScore + row.analysis.visibilityScore) / 3, 0) / total;
  const urgent = [...analyses].sort((a, b) => b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore).slice(0, 5);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-clay">Rejected Economy Intelligence</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink md:text-5xl">
          Recover trapped resale revenue before it turns into dead inventory.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          ResaleIQ flags stale inventory, weak margins, compliance gaps, and platform mismatch so every listing gets a clear recovery action.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ScoreCard title="Recoverable Revenue" value={`$${recoverableRevenue.toFixed(0)}`} helper="Value currently sitting in tracked inventory" />
        <ScoreCard title="High-Risk Listings" value={highRisk} helper="Needs action first" />
        <ScoreCard title="Dead Inventory Alerts" value={deadAlerts} helper="Risk score 60+" />
        <ScoreCard title="Estimated Profit Leaks" value={`$${profitLeaks.toFixed(0)}`} helper="Stale + weak margin exposure" />
        <ScoreCard title="Average Listing Health" value={avgHealth.toFixed(1)} helper="Compliance + profit + visibility" />
      </div>

      <div className="rounded-3xl border border-tan bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Immediate Recovery Queue</p>
            <h3 className="mt-1 text-xl font-semibold text-ink">Fix these before listing anything new</h3>
          </div>
          <p className="text-sm text-slate-600">Top listings ranked by dead-inventory risk.</p>
        </div>
        <div className="mt-5 grid gap-3">
          {urgent.map(({ item, analysis }) => (
            <div key={item.title} className="rounded-2xl border border-tan/80 bg-ivory p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.platform} • {item.listingAgeDays} days old • ${item.targetSalePrice.toFixed(0)} target</p>
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
