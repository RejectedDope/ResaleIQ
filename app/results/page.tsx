'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AnalysisResult } from '@/lib/inventory';

const sections = ['Fix These First', 'High Stale Risk', 'Pricing / Margin Review', 'Listing Quality Fixes', 'Shipping Friction', 'Data Gaps'];

type Stored = { analyzed: AnalysisResult[]; missingFields: string[]; sourceFile: string };

export default function ResultsPage() {
  const [data, setData] = useState<Stored | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('resaleiq-analysis');
    if (raw) setData(JSON.parse(raw));
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, AnalysisResult[]> = Object.fromEntries(sections.map((s) => [s, []]));
    for (const row of data?.analyzed || []) {
      for (const s of row.sections) if (groups[s]) groups[s].push(row);
    }
    return groups;
  }, [data]);

  if (!data) return <main className="rounded-2xl border border-slate-800 bg-slate-900 p-6">No analyzed inventory yet. Run a scan from /inventory.</main>;

  return (
    <main className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        <p>Source file: {data.sourceFile}</p>
        <p>Items analyzed: {data.analyzed.length}</p>
        {data.missingFields.length ? <p>Validation warnings: missing {data.missingFields.join(', ')}</p> : <p>Validation: no required field gaps detected.</p>}
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => navigator.clipboard.writeText(JSON.stringify(data.analyzed, null, 2))}>Copy recommendations</button>
        <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => {
          const header = ['title','platform','listedPrice','daysListed','risk','problems','recommendedActions','confidence','reasoning','nextAction'];
          const lines = [header.join(',')].concat(data.analyzed.map((r)=>[
            r.title,r.platform,r.listedPrice ?? '',r.daysListed ?? '',r.risk,`"${r.problems.join('; ')}"`,`"${r.recommendedActions.join('; ')}"`,r.confidence,`"${r.reasoning}"`,r.nextAction
          ].join(',')));
          const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'analysis-results.csv'; a.click();
        }}>Download analyzed CSV</button>
      </div>
      {sections.map((s) => (
        <section key={s} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold">{s}</h2>
          <div className="mt-3 grid gap-3">
            {(grouped[s] || []).length ? grouped[s].map((r) => (
              <article key={`${s}-${r.id}`} className="rounded-xl border border-slate-700 p-4 text-sm">
                <p className="font-semibold">{r.title}</p>
                <p className="text-slate-300">{r.platform} • ${r.listedPrice ?? 'N/A'} • {r.daysListed ?? 'N/A'} days</p>
                <p>Risk/status: {r.risk}</p>
                <p>Problems detected: {r.problems.join('; ')}</p>
                <p>Recommended actions: {r.recommendedActions.join(', ')}</p>
                <p>Confidence level: {r.confidence}</p>
                <p>Reasoning: {r.reasoning}</p>
                <p>Next action: {r.nextAction}</p>
              </article>
            )) : <p className="text-sm text-slate-400">No items currently prioritized here.</p>}
          </div>
        </section>
      ))}
    </main>
  );
}
