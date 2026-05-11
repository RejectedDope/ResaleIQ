import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

export default function HomePage() {
  const rows = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));
  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.targetSalePrice, 0);
  const priorityCount = rows.filter((r) => r.analysis.deadListingRisk.recoveryPriority >= 60).length;

  return (
    <section className="space-y-6 pb-8">
      <div className="rounded-xl border border-[#27324a] bg-[#0d1524] p-6 text-[#f6f8fc]">
        <p className="text-xs font-semibold tracking-wide text-[#d6ba7a]">ResaleIQ</p>
        <h1 className="mt-2 text-3xl font-semibold">Upload Any Inventory. Find What&apos;s Losing Money.</h1>
        <p className="mt-3 max-w-3xl text-sm text-[#afbdd2]">Upload spreadsheets, screenshots, item photos, or messy reseller exports. ResaleIQ identifies stale inventory, pricing mistakes, trapped profit, and recovery actions automatically.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/login?next=/inventory" className="rounded-md bg-[#d6ba7a] px-4 py-2 text-sm font-semibold text-[#0a0d14]">Login to Start Free Inventory Scan</a>
          <a href="/sample-report" className="rounded-md border border-[#34415d] px-4 py-2 text-sm">See Sample Recovery Report</a>
          <a href="/pricing" className="rounded-md border border-[#34415d] px-4 py-2 text-sm">Pricing</a>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {['1. Upload Anything', '2. Confirm Fields', '3. See Recovery Actions', '4. Recover Profit'].map((step) => (
          <div key={step} className="rounded-md border border-[#27324a] bg-[#0d1524] p-3 text-sm font-medium">{step}</div>
        ))}
      </div>

      <div className="rounded-xl border border-[#27324a] bg-[#0d1524] p-5">
        <h2 className="text-lg font-semibold">Upload Spreadsheet, Screenshot, or Item Photos</h2>
        <p className="mt-1 text-sm text-[#afbdd2]">Messy inventory is okay.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#c2ccdc]"><span className="rounded border border-[#34415d] px-2 py-1">XLSX</span><span className="rounded border border-[#34415d] px-2 py-1">CSV</span><span className="rounded border border-[#34415d] px-2 py-1">Image upload</span><span className="rounded border border-[#34415d] px-2 py-1">Screenshot upload</span></div>
      </div>

      <div className="rounded-xl border border-[#27324a] bg-[#0d1524] p-5">
        <p className="text-xs tracking-wide text-[#d6ba7a]">Sample Recovery Result</p>
        <p className="mt-2 font-semibold">Coach Leather Tote</p>
        <p className="text-sm text-[#afbdd2]">Listed 143 Days · Recovery Opportunity: +$42</p>
        <p className="text-sm">Action Needed: Relist + Reduce Price 12%</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Trapped Profit" value={`$${recoverableRevenue.toFixed(0)}`} />
        <Metric label="Action Needed" value={`${priorityCount} listings`} />
        <Metric label="What to Fix Next" value="Open Recovery Queue" />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-[#27324a] bg-[#0d1524] p-3"><p className="text-xs text-[#aab2c1]">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}
