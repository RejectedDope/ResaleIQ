import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

function kpiFormat(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

export default function HomePage() {
  const rows = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));
  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.targetSalePrice, 0);
  const avgHealth = Math.round(rows.reduce((sum, row) => sum + row.analysis.deadListingRisk.listingHealthScore, 0) / Math.max(rows.length, 1));
  const avgExposure = Math.round(rows.reduce((sum, row) => sum + row.analysis.deadListingRisk.exposureScore, 0) / Math.max(rows.length, 1));
  const topQueue = [...rows].sort((a, b) => b.analysis.deadListingRisk.recoveryPriority - a.analysis.deadListingRisk.recoveryPriority).slice(0, 3);

  return (
    <section className="space-y-10 pb-10">
      <div className="rounded-[32px] border border-[#2E3448] bg-gradient-to-b from-[#121722] to-[#090D15] p-6 text-[#F6F1E8] shadow-2xl md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D6BA7A]">Rejected Economy</p>
            <h1 className="mt-5 text-4xl font-black leading-[0.95] md:text-6xl">TURN REJECTED INVENTORY INTO PREDICTABLE PROFIT.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#C4C9D4]">Combining commerce, inventory intelligence, and recovery systems to help resellers source better, sell smarter, and recover trapped money faster.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/inventory" className="rounded-2xl bg-[#D6BA7A] px-5 py-3 text-sm font-extrabold text-[#0A0D14]">Get Recovery Audit</a>
              <a href="/analyze" className="rounded-2xl border border-[#3D445B] bg-[#121722] px-5 py-3 text-sm font-bold text-[#F6F1E8]">Explore ResaleIQ</a>
              <a href="/dead-listings" className="rounded-2xl border border-[#3D445B] bg-transparent px-5 py-3 text-sm font-bold text-[#C4C9D4]">Shop Rejected Treasures</a>
            </div>
          </div>
          <div className="rounded-3xl border border-[#2E3448] bg-[#0D121D] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9EA5B5]">Live Intelligence Snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Panel title="Exposure" value={`${avgExposure}/100`} />
              <Panel title="Listing Health" value={`${avgHealth}/100`} />
              <Panel title="Recoverable" value={`$${recoverableRevenue.toFixed(0)}`} />
              <Panel title="Priority Queue" value={`${topQueue.length} items`} />
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-3 border-t border-[#242B3B] pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Strip label="Inventory Recovered" value={`$${kpiFormat(Math.round(recoverableRevenue * 8.4))}`} />
          <Strip label="Listings Analyzed" value={kpiFormat(rows.length * 412)} />
          <Strip label="Avg Accuracy Score" value="93.4%" />
          <Strip label="Resellers Powered" value="2.1K" />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <EcosystemCard title="Rejected Treasures" subtitle="The Commerce Engine" bullets={["Curated Inventory", "Vintage / Streetwear / Collectibles", "Sourcing & Flipping", "Marketplace Sales"]} />
        <EcosystemCard title="ResaleIQ" subtitle="The Intelligence Engine" bullets={["AI-Powered Analytics", "Inventory Intelligence", "Recovery Optimization", "Operational Systems"]} />
      </section>

      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D6BA7A]">ResaleIQ — Commerce Intelligence Platform</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {['Dead Inventory Detection','Listing Optimization','Pricing Intelligence','Inventory Health','Profit Leak Analysis','AI Listing Generator','Crosslisting Intelligence','Marketplace Strategy','Sell-Through Optimization'].map((f) => (
            <div key={f} className="rounded-2xl border border-[#2A3144] bg-[#0E1320] p-4 text-[#EDE8DE]">
              <p className="text-sm font-extrabold">{f}</p>
              <p className="mt-2 text-xs text-[#AEB4C2]">Tactical signal + next best action.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#2A3144] bg-[#0E1320] p-6 text-[#F6F1E8]">
        <h2 className="text-2xl font-black">GET YOUR FREE RECOVERY AUDIT</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#B8BECC]">Upload inventory and discover dead listings, hidden fee leaks, pricing mistakes, stale inventory, trapped capital, and low ROI items.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-dashed border-[#3A4258] bg-[#121722] p-4 text-sm font-bold text-[#C9CFDA]">Upload Inventory File</div>
          <div className="rounded-2xl border border-[#2A3144] bg-[#121722] p-4 text-sm text-[#C9CFDA]">Sample Result: Recoverable profit +$412</div>
          <a href="/inventory" className="rounded-2xl bg-[#D6BA7A] p-4 text-center text-sm font-extrabold text-[#0A0D14]">Start Audit Intake</a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {['dead inventory recovery','pricing psychology','marketplace strategy','eBay updates','operational systems','reseller automation'].map((topic) => (
          <div key={topic} className="rounded-2xl border border-[#2A3144] bg-[#0E1320] p-4 text-[#F6F1E8]"><p className="text-sm font-bold capitalize">{topic}</p></div>
        ))}
      </section>

      <section className="rounded-[30px] border border-[#2E3448] bg-gradient-to-r from-[#101521] to-[#0A0D14] p-8 text-[#F6F1E8]">
        <h2 className="text-3xl font-black">MOST RESELLERS LIST INVENTORY. THE BEST OPERATORS BUILD SYSTEMS.</h2>
        <p className="mt-3 text-[#B7BDCC]">Rejected Economy gives resellers operational leverage.</p>
        <a href="/inventory" className="mt-6 inline-block rounded-2xl bg-[#D6BA7A] px-5 py-3 font-extrabold text-[#0A0D14]">Join the Economy</a>
      </section>
    </section>
  );
}

function Panel({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-[#2A3144] bg-[#141A28] p-4"><p className="text-xs text-[#9EA5B5]">{title}</p><p className="mt-2 text-2xl font-black text-[#EDE8DE]">{value}</p></div>; }
function Strip({ label, value }: { label: string; value: string }) { return <div><p className="text-xs uppercase tracking-[0.16em] text-[#9EA5B5]">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>; }
function EcosystemCard({ title, subtitle, bullets }: { title: string; subtitle: string; bullets: string[] }) {
  return <div className="rounded-3xl border border-[#2A3144] bg-[#0E1320] p-6 text-[#F6F1E8]"><p className="text-xs uppercase tracking-[0.18em] text-[#D6BA7A]">{subtitle}</p><h3 className="mt-2 text-3xl font-black">{title}</h3><ul className="mt-4 space-y-2 text-sm text-[#B9C0CF]">{bullets.map((b)=><li key={b}>• {b}</li>)}</ul></div>;
}
