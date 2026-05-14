import KpiCard from '@/components/KpiCard';
import DiagnosticCard from '@/components/DiagnosticCard';

const kpis = [
  ['Dead Inventory Risk', '38%', 'danger', 'Inventory aging detected.'],
  ['Sell-Through Probability', '54%', 'warn', 'Marketplace mismatch detected.'],
  ['Estimated Days-to-Sale', '74', 'warn', 'Cash trapped in inventory.'],
  ['Velocity Tier', 'Slow Capital', 'danger', 'Dead stock doesn’t pay.'],
  ['Saturation Score', '71/100', 'warn', 'You’re likely overpriced.'],
  ['Buyer Confidence Score', '62/100', 'neutral', 'Listing visibility declining.'],
  ['Margin Efficiency', '19%', 'profit', 'Profit leak identified.'],
  ['Platform Match Score', '68%', 'neutral', 'Recovery opportunity found.'],
] as const;

export default function HomePage() {
  return (
    <main className="space-y-6 text-[#F2EFE8]">
      <section className="rounded-2xl border border-slate-700 bg-[#0A0A0A] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#FF2D8D]">ResaleIQ • Inventory Intelligence & Profit Recovery Operating System</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">Recovery Dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">MOVE INVENTORY. RECOVER PROFIT. Stop pricing blind. ResaleIQ flags dead stock, profit leaks, and marketplace friction so you can recover trapped cash faster.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {kpis.map(([label, value, tone, sub]) => <KpiCard key={label} label={label} value={value} tone={tone as any} sub={sub} />)}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-[#1A1A1A] p-4 lg:col-span-2">
          <h2 className="text-lg font-bold uppercase">Market Intelligence Panel</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <p>Active listings: <b>1,284</b></p><p>Sold count: <b>402</b></p>
            <p>Pricing spread: <b>$18 - $145</b></p><p>Category competitiveness: <b>High</b></p>
            <p>Estimated demand: <b>Moderate</b></p><p>Competition meter: <b className="text-amber-300">72%</b></p>
          </div>
          <p className="mt-3 rounded bg-amber-900/40 p-2 text-sm">Signal: HIGH DEMAND / OVERSATURATED</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-[#1A1A1A] p-4">
          <h2 className="text-lg font-bold uppercase">Inventory Velocity Engine</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>FAST FLIP: 21%</li>
            <li>MEDIUM TURN: 33%</li>
            <li>SLOW CAPITAL: 29%</li>
            <li className="text-rose-300">DEAD STOCK: 17%</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DiagnosticCard title="Listing Performance Diagnostics" diagnosis="High impressions + low clicks indicates thumbnail/title weakness on 41 SKUs." confidence="High" action="Improve Photos + Rewrite Title" badge="Urgent" />
        <DiagnosticCard title="Dead Inventory Center" diagnosis="Price resistance and shipping friction are blocking conversion on stale shoes and collectibles." confidence="High" action="Markdown + Adjust Shipping + Relist timing" badge="Critical" />
        <DiagnosticCard title="Platform Intelligence Engine" diagnosis="eBay visibility strong, Mercari engagement weak for high-ticket hard goods." confidence="Medium" action="Reassign platform priority and test Depop/Etsy fit" />
        <DiagnosticCard title="Profit Leak Scanner" diagnosis="Fee impact and shipping losses are reducing expected net margin by 11.8%." confidence="Medium" action="Reprice with fee-aware margin floor" />
      </section>

      <section className="rounded-xl border border-slate-700 bg-[#1A1A1A] p-4">
        <h2 className="text-lg font-bold uppercase">Recovery Actions Panel</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          {['Relist Now', 'Send Offers', 'Markdown', 'Crosslist', 'Bundle', 'Liquidate', 'Improve Photos', 'Rewrite Title'].map((a) => (
            <div key={a} className="rounded border border-slate-600 bg-[#0A0A0A] px-3 py-2 font-semibold">{a}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
