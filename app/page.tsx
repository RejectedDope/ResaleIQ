import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

export default function HomePage() {
  const rows = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));
  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.targetSalePrice, 0);
  const priorityCount = rows.filter((r) => r.analysis.deadListingRisk.recoveryPriority >= 60).length;

  return (
    <section className="space-y-8 pb-10">
      <div className="rounded-[30px] border border-[#2E3448] bg-gradient-to-b from-[#121722] to-[#090D15] p-6 text-[#F6F1E8] md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D6BA7A]">ResaleIQ</p>
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Upload Any Inventory. <br/>Find What&apos;s Losing Money.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#C4C9D4]">Upload spreadsheets, screenshots, item photos, or messy reseller exports. ResaleIQ identifies stale inventory, pricing mistakes, trapped profit, and recovery actions automatically.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/inventory" className="rounded-2xl bg-[#D6BA7A] px-5 py-3 text-sm font-extrabold text-[#0A0D14]">Start Free Inventory Scan</a>
          <a href="/sample-report" className="rounded-2xl border border-[#3D445B] bg-[#121722] px-5 py-3 text-sm font-bold">See Sample Recovery Report</a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {['1. Upload Anything', '2. Confirm Fields', '3. See Recovery Actions', '4. Recover Profit'].map((step) => (
          <div key={step} className="rounded-2xl border border-[#2A3144] bg-[#0E1320] p-4 text-sm font-extrabold text-[#EDE8DE]">{step}</div>
        ))}
      </div>

      <div className="rounded-3xl border border-[#2A3144] bg-[#0E1320] p-6">
        <h2 className="text-2xl font-black text-[#F6F1E8]">Upload Spreadsheet, Screenshot, or Item Photos</h2>
        <p className="mt-2 text-sm text-[#B8BECC]">Messy inventory is okay.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#C9CFDA]">
          <span className="rounded-full border border-[#394159] px-3 py-2">XLSX</span>
          <span className="rounded-full border border-[#394159] px-3 py-2">CSV</span>
          <span className="rounded-full border border-[#394159] px-3 py-2">Image Upload</span>
          <span className="rounded-full border border-[#394159] px-3 py-2">Screenshot Upload</span>
        </div>
        <a href="/inventory" className="mt-5 inline-block rounded-2xl bg-[#D6BA7A] px-5 py-3 text-sm font-extrabold text-[#0A0D14]">Start Free Inventory Scan</a>
      </div>

      <div className="rounded-3xl border border-[#2A3144] bg-[#0E1320] p-6 text-[#F6F1E8]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D6BA7A]">Sample Recovery Result</p>
        <h3 className="mt-2 text-2xl font-black">Coach Leather Tote</h3>
        <p className="mt-2 text-sm text-[#C4C9D4]">Listed 143 Days</p>
        <p className="mt-1 text-sm text-[#C4C9D4]">Recovery Opportunity: +$42</p>
        <p className="mt-1 text-sm font-bold text-[#EDE8DE]">Action: Relist + Reduce Price 12%</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Trapped Profit" value={`$${recoverableRevenue.toFixed(0)}`} />
        <Metric label="Action Needed" value={`${priorityCount} listings`} />
        <Metric label="What to Fix Next" value="Open Recovery Queue" />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#2A3144] bg-[#0E1320] p-4"><p className="text-xs uppercase tracking-[0.14em] text-[#AAB2C1]">{label}</p><p className="mt-2 text-xl font-black text-[#F6F1E8]">{value}</p></div>;
}
