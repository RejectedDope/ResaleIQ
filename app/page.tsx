import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-bold">Inventory Recovery MVP</h1>
        <p className="mt-3 text-slate-300">
          Upload inventory CSV files, detect stale/problem listings with deterministic rules, and get clear recovery recommendations.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/inventory" className="rounded-lg bg-violet-500 px-4 py-2 font-semibold text-white">Start Inventory Scan</Link>
          <Link href="/results" className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-200">View Results</Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold">1) Upload Inventory CSV</h2>
          <p className="mt-2 text-sm text-slate-300">Use your own file or one of the provided sample test files.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold">2) Analyze Listing Friction</h2>
          <p className="mt-2 text-sm text-slate-300">Rules detect stale age, pricing/shipping friction, listing weakness, and data gaps.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold">3) Execute Recovery Actions</h2>
          <p className="mt-2 text-sm text-slate-300">See prioritized actions like relist, reduce price, improve title, or gather missing data.</p>
        </div>
      </section>
    </main>
  );
}
