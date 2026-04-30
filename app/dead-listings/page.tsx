import { RiskBadge } from '@/components/RiskBadge';
import { ScoreCard } from '@/components/ScoreCard';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

function itemRoi(item: (typeof sampleInventory)[number]) {
  return Math.round(((item.targetSalePrice - item.purchaseCost - item.shippingPaid) / Math.max(item.purchaseCost, 1)) * 100);
}

export default function DeadListingsPage() {
  const rows = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item), roi: itemRoi(item) }));
  const total = rows.length || 1;
  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.targetSalePrice, 0);
  const highRisk = rows.filter((row) => row.analysis.deadListingRisk.riskLevel === 'High').length;
  const recoveryScore = Math.round(rows.reduce((sum, row) => sum + (100 - row.analysis.deadListingRisk.riskScore), 0) / total);
  const emergencyQueue = [...rows].sort((a, b) => b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore).slice(0, 4);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Recovery Room</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Fix the items costing you money right now.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              This room turns stale listings into a prioritized repair queue with a visible money action on every item.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Recoverable Inventory</p>
            <p className="mt-2 text-5xl font-extrabold text-[#7AF59A]">${recoverableRevenue.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard title="Recoverable Revenue" value={`$${recoverableRevenue.toFixed(0)}`} helper="Potential revenue represented by current sample inventory." tone="success" />
        <ScoreCard title="Recovery Score" value={`${recoveryScore}/100`} helper="Higher means less dead-inventory pressure across the shelf." tone="dark" />
        <ScoreCard title="Fix Now Items" value={highRisk} helper="High-risk rows needing action before new sourcing." tone={highRisk ? 'danger' : 'neutral'} />
      </div>

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Emergency Queue</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Do these first</h3>
          </div>
          <p className="text-sm font-semibold text-slate-600">Sorted by money risk</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {emergencyQueue.map(({ item, analysis, roi }) => (
            <div key={item.title} className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{analysis.deadListingRisk.topIssue}</p>
                </div>
                <RiskBadge level={analysis.deadListingRisk.riskLevel} />
              </div>
              <div className="mt-4 rounded-2xl bg-[#070A18] p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Fix Now</p>
                <p className="mt-1 text-3xl font-extrabold">{analysis.deadListingRisk.recommendedAction}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-white px-3 py-1 text-red-800">Risk {analysis.deadListingRisk.riskScore}</span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-700">${item.targetSalePrice.toFixed(0)} recoverable</span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-700">ROI {roi}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-tan bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#070A18] text-white">
            <tr>
              <th className="p-4">Item</th>
              <th className="p-4">Platform</th>
              <th className="p-4">Age</th>
              <th className="p-4">Recoverable</th>
              <th className="p-4">ROI</th>
              <th className="p-4">Dead Risk</th>
              <th className="p-4">Money Blocker</th>
              <th className="p-4">Fix Now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, analysis, roi }) => {
              const high = analysis.deadListingRisk.riskLevel === 'High';
              return (
                <tr key={item.title} className={`border-t border-tan/70 align-top ${high ? 'bg-red-50' : 'bg-white'}`}>
                  <td className="p-4 font-bold text-ink">{item.title}</td>
                  <td className="p-4 text-slate-700">{item.platform}</td>
                  <td className="p-4 text-slate-700">{item.listingAgeDays}d</td>
                  <td className="p-4 font-extrabold text-ink">${item.targetSalePrice.toFixed(2)}</td>
                  <td className={`p-4 font-extrabold ${roi < 50 ? 'text-red-700' : 'text-sage'}`}>{roi}%</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-extrabold text-ink">{analysis.deadListingRisk.riskScore}</span>
                      <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                    </div>
                  </td>
                  <td className="p-4 text-slate-700">{analysis.deadListingRisk.topIssue}</td>
                  <td className="p-4">
                    <span className="inline-flex rounded-2xl bg-[#070A18] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white">
                      {analysis.deadListingRisk.recommendedAction}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
