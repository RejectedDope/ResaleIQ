import { RiskBadge } from '@/components/RiskBadge';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

export default function HomePage() {
  const analyses = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));
  const total = analyses.length || 1;
  const critical = analyses.filter((x) => x.analysis.deadListingRisk.decayTier === 'CRITICAL').length;
  const dead = analyses.filter((x) => x.analysis.deadListingRisk.lifecycleStage === 'Dead Inventory').length;
  const recoverable = analyses.reduce((sum, x) => sum + x.item.targetSalePrice, 0);
  const health = Math.round(analyses.reduce((sum, x) => sum + x.analysis.deadListingRisk.listingHealthScore, 0) / total);
  const urgent = [...analyses].sort((a, b) => b.analysis.deadListingRisk.recoveryPriority - a.analysis.deadListingRisk.recoveryPriority);

  return <section className="space-y-8">
    <div className="rounded-3xl border border-[#1C2440] bg-[#070A18] p-8 text-white">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7AF59A]">Inventory Performance Intelligence</p>
      <h1 className="mt-3 text-5xl font-extrabold">Your listings are not dead. They are invisible.</h1>
      <p className="mt-4 max-w-3xl text-slate-300">ResaleIQ detects visibility decay, dead inventory risk, and recovery actions before inventory becomes dead capital.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      <Metric label="Recoverable Revenue" value={`$${recoverable.toFixed(0)}`} />
      <Metric label="Inventory Health" value={`${health}/100`} />
      <Metric label="Critical Decay" value={`${critical}`} />
      <Metric label="Dead Inventory" value={`${dead}`} />
    </div>

    <div className="rounded-2xl border border-tan bg-white p-6">
      <h2 className="text-2xl font-extrabold text-ink">Recovery Priority Queue</h2>
      <div className="mt-4 space-y-3">
        {urgent.map(({ item, analysis }) => <div key={item.title} className="rounded-xl border border-tan bg-ivory p-4 flex items-center justify-between gap-3"><div><p className="font-bold text-ink">{item.title}</p><p className="text-sm text-slate-600">Exposure {analysis.deadListingRisk.exposureScore}/100 • Health {analysis.deadListingRisk.listingHealthScore}/100 • CTR {analysis.deadListingRisk.ctr.toFixed(2)}%</p></div><div className="text-right"><RiskBadge level={analysis.deadListingRisk.riskLevel} /><p className="mt-1 text-xs font-bold uppercase">{analysis.deadListingRisk.lifecycleStage}</p></div></div>)}
      </div>
    </div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-tan bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold text-ink">{value}</p></div>;
}
