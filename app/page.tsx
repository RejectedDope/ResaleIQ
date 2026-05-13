import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300">ResaleIQ Recovery Workflow</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Find Out Why Your Inventory Isn’t Selling</h1>
        <p className="mt-4 max-w-3xl text-slate-300">ResaleIQ scans stale inventory, pricing problems, listing weakness, shipping friction, and visibility decay so sellers know what to fix before inventory quietly dies.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/inventory" className="rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white">Start Inventory Scan</Link>
          <Link href="/sample-report" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200">View Sample Report</Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-semibold">Money Gets Trapped in Inventory</h2>
        <p className="mt-3 text-slate-300">Unsold listings tie up cash, raise carrying costs, and hide operational leaks. Recovery starts with clarity on what is stale and why.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {['Upload listings', 'Detect friction', 'Take recovery actions'].map((step, i) => (
          <div key={step} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-violet-300">Step {i + 1}</p>
            <h3 className="mt-2 text-lg font-semibold">{step}</h3>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">Sample Recovery Preview</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>• 27 listings flagged for stale risk over 90 days.</li>
          <li>• 12 items priced above market comps by 15%+.</li>
          <li>• 9 listings missing shipping details reducing visibility.</li>
        </ul>
      </section>
    </main>
  );
}
