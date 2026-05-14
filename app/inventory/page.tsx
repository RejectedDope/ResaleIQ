'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeInventory, normalizeRows, parseCsv } from '@/lib/inventory';

export default function InventoryPage() {
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<string>('No file uploaded yet.');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function processCsv(name: string, text: string) {
    setLoading(true);
    setError('');
    setFileName(name);
    setStatus('Parsing file...');
    try {
      const parsed = parseCsv(text);
      if (!parsed.length) throw new Error('No readable rows were found in this CSV.');
      const { items, missingFields } = normalizeRows(parsed);
      const analyzed = analyzeInventory(items);
      setStatus(missingFields.length ? `Parsed with warnings: missing ${missingFields.join(', ')}` : 'Parsed successfully.');
      localStorage.setItem('resaleiq-analysis', JSON.stringify({ analyzed, missingFields, sourceFile: name }));
      router.push('/results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process file. Please check formatting and try again.');
      setStatus('Validation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory Scan Upload</h1>
      <p className="text-slate-300">Upload a CSV inventory export to analyze stale risk and recovery actions.</p>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            processCsv(f.name, text);
          }}
        />
        <p className="mt-3 text-sm text-slate-300">Accepted now: CSV. XLSX upload area remains placeholder until implemented.</p>
        <p className="mt-1 text-sm">File: {fileName || 'None'}</p>
        <p className="mt-1 text-sm">Status: {loading ? 'Loading...' : status}</p>
        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
        <p>Quick test files:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {['healthy-inventory.csv', 'stale-inventory.csv', 'mixed-inventory.csv', 'malformed-inventory.csv', 'missing-fields-inventory.csv', 'duplicate-inventory.csv'].map((name) => (
            <button
              key={name}
              className="rounded-lg border border-slate-700 px-3 py-1 hover:bg-slate-800"
              onClick={async () => {
                const res = await fetch(`/test-data/${name}`);
                const text = await res.text();
                processCsv(name, text);
              }}
            >
              Use {name}
            </button>
          ))}
        </div>
        <a className="mt-4 inline-block text-violet-300 underline" href="/test-data/sample-template.csv">Download sample template</a>
      </div>
    </main>
  );
}
