'use client';

import { useState } from 'react';
import { RiskBadge } from '@/components/RiskBadge';
import { RecommendationList } from '@/components/RecommendationList';
import { evaluateCompliance } from '@/lib/compliance';
import { ComplianceResult } from '@/lib/types';

const FIELD_NAMES = ['title', 'brand', 'category', 'condition', 'size', 'color', 'material'] as const;

export default function CompliancePage() {
  const [input, setInput] = useState({
    title: '',
    brand: '',
    category: 'Fashion Apparel',
    condition: '',
    size: '',
    color: '',
    material: '',
    safetyDocs: false,
    gradingDescriptors: false,
  });
  const [result, setResult] = useState<ComplianceResult | null>(null);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Compliance</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Fix the missing details that keep inventory from selling.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Missing condition, size, material, safety, or grading data can bury inventory before price changes help.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form
          className="rounded-2xl border border-tan bg-white p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setResult(evaluateCompliance(input));
          }}
        >
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Listing Metadata</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Fix inputs</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {FIELD_NAMES.map((field) => (
              <label key={field} className="text-sm font-bold capitalize text-slate-700">
                {field}
                <input value={input[field]} onChange={(e) => setInput((p) => ({ ...p, [field]: e.target.value }))} />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl bg-ivory px-4 py-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={input.safetyDocs} onChange={(e) => setInput((p) => ({ ...p, safetyDocs: e.target.checked }))} />
              Safety docs available
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-ivory px-4 py-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={input.gradingDescriptors} onChange={(e) => setInput((p) => ({ ...p, gradingDescriptors: e.target.checked }))} />
              Grading descriptors included
            </label>
          </div>

          <button className="mt-6 w-full bg-sage text-white hover:bg-[#4d654f]">Fix Compliance Risk</button>
        </form>

        {result ? (
          <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Money Visibility Score</p>
                <p className="mt-2 text-5xl font-extrabold text-ink">{result.complianceScore}</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{result.explanation}</p>
              </div>
              <RiskBadge level={result.riskLevel} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <RecommendationList title="Fix these fields" items={result.missingFields.length ? result.missingFields : ['No missing fields']} />
              <RecommendationList title="Stop suppression" items={result.requiredFixes.length ? result.requiredFixes : ['No required fixes']} />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[360px] items-center rounded-2xl border border-dashed border-tan bg-white p-8 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Ready</p>
              <h3 className="mt-3 text-3xl font-extrabold text-ink">Fix listing metadata before recovering the item.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">The result separates harmless gaps from issues that can suppress visibility or create marketplace risk.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
