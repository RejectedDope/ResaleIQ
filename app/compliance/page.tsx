'use client';

import { useState } from 'react';
import { RiskBadge } from '@/components/RiskBadge';
import { RecommendationList } from '@/components/RecommendationList';
import { evaluateCompliance } from '@/lib/compliance';
import { ComplianceResult } from '@/lib/types';

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
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Compliance Checker</h2>
      <form
        className="grid grid-cols-1 gap-3 rounded-xl border border-tan bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(evaluateCompliance(input));
        }}
      >
        {['title', 'brand', 'category', 'condition', 'size', 'color', 'material'].map((field) => (
          <label key={field} className="text-sm capitalize">
            {field}
            <input value={input[field as keyof typeof input] as string} onChange={(e) => setInput((p) => ({ ...p, [field]: e.target.value }))} />
          </label>
        ))}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={input.safetyDocs} onChange={(e) => setInput((p) => ({ ...p, safetyDocs: e.target.checked }))} />
          Safety docs available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.gradingDescriptors}
            onChange={(e) => setInput((p) => ({ ...p, gradingDescriptors: e.target.checked }))}
          />
          Grading descriptors included
        </label>

        <button className="bg-sage text-white md:col-span-2">Check Compliance</button>
      </form>

      {result ? (
        <div className="rounded-xl border border-tan bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-lg font-semibold">Compliance Score: {result.complianceScore}</p>
            <RiskBadge level={result.riskLevel} />
          </div>
          <p className="text-sm text-slate-600">{result.explanation}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <RecommendationList title="Missing fields" items={result.missingFields.length ? result.missingFields : ['None']} />
            <RecommendationList title="Required fixes" items={result.requiredFixes.length ? result.requiredFixes : ['No required fixes']} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
