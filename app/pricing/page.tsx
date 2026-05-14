export default function PricingPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Free Scan', 'Basic upload and stale inventory snapshot.'],
          ['Recovery Audit', 'Manual deep review with prioritized fix plan.'],
          ['Future Monitoring', 'Planned recurring inventory health checks.'],
        ].map(([name, desc]) => (
          <div key={name} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-semibold">{name}</h2><p className="mt-2 text-sm text-slate-300">{desc}</p></div>
        ))}
      </div>
      <form className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold">Request Access</h2>
        <div className="mt-4 grid gap-3">
          {['name', 'email', 'platform', 'active listing count', 'biggest inventory problem'].map((f) => (
            <input key={f} aria-label={f} placeholder={f} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          ))}
        </div>
      </form>
    </main>
  );
}
