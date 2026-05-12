export default function InventoryPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Scan Upload</h1>
      <p className="text-slate-300">Upload your inventory export to begin the recovery scan foundation.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">CSV Upload Area</h2>
          <div className="mt-3 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">Drop CSV file here (placeholder)</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">XLSX Upload Area</h2>
          <div className="mt-3 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">Drop XLSX file here (placeholder)</div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
        <p>Accepted formats: .csv, .xlsx</p>
        <a className="mt-2 inline-block text-violet-300 underline" href="/test-data/sample-template.csv">Download sample template</a>
        <p className="mt-4">No file uploaded yet. Once uploaded, we will validate columns and prepare a scan preview.</p>
        <p className="mt-2 text-slate-400">Loading state placeholder: “Preparing your inventory scan…”</p>
      </div>
    </main>
  );
}
