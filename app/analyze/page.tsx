'use client';

import { useState } from 'react';
import { ScoreCard } from '@/components/ScoreCard';
import { RiskBadge } from '@/components/RiskBadge';
import { RecommendationList } from '@/components/RecommendationList';
import { ListingOutputCard } from '@/components/ListingOutputCard';
import { analyzeListing } from '@/lib/listingGenerator';
import { ListingAnalysis, ListingInput } from '@/lib/types';

const INITIAL: ListingInput = {
  title: '',
  brand: '',
  category: 'Fashion Apparel',
  condition: '',
  size: '',
  color: '',
  material: '',
  purchaseCost: 0,
  targetSalePrice: 0,
  shippingPaid: 0,
  shippingCharged: 0,
  platform: 'eBay',
  listingAgeDays: 0,
  notes: '',
  safetyDocs: false,
  gradingDescriptors: false,
};

export default function AnalyzePage() {
  const [form, setForm] = useState<ListingInput>(INITIAL);
  const [analysis, setAnalysis] = useState<ListingAnalysis | null>(null);

  const update = (key: keyof ListingInput, value: string | number | boolean) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">New Item Analysis</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAnalysis(analyzeListing(form));
        }}
        className="grid grid-cols-1 gap-3 rounded-xl border border-tan bg-white p-4 md:grid-cols-2"
      >
        {[
          ['title', 'Item title'],
          ['brand', 'Brand'],
          ['category', 'Category'],
          ['condition', 'Condition'],
          ['size', 'Size'],
          ['color', 'Color'],
          ['material', 'Material'],
          ['platform', 'Platform'],
          ['notes', 'Notes'],
        ].map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input value={String(form[key as keyof ListingInput] ?? '')} onChange={(e) => update(key as keyof ListingInput, e.target.value)} />
          </label>
        ))}

        {[
          ['purchaseCost', 'Purchase cost'],
          ['targetSalePrice', 'Target sale price'],
          ['shippingPaid', 'Shipping paid'],
          ['shippingCharged', 'Shipping charged'],
          ['listingAgeDays', 'Listing age in days'],
        ].map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              type="number"
              min={0}
              step="0.01"
              value={Number(form[key as keyof ListingInput])}
              onChange={(e) => update(key as keyof ListingInput, Number(e.target.value))}
            />
          </label>
        ))}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.safetyDocs} onChange={(e) => update('safetyDocs', e.target.checked)} /> Safety docs available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.gradingDescriptors}
            onChange={(e) => update('gradingDescriptors', e.target.checked)}
          />
          Grading descriptors included
        </label>

        <button className="bg-clay text-white md:col-span-2" type="submit">
          Analyze Listing
        </button>
      </form>

      {analysis ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ScoreCard title="Compliance Score" value={analysis.complianceScore} />
            <ScoreCard title="Profit Score" value={analysis.profitScore} />
            <ScoreCard title="Visibility Score" value={analysis.visibilityScore} />
            <div className="rounded-xl border border-tan bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Dead Listing Risk</p>
              <p className="mt-2 text-2xl font-semibold">{analysis.deadListingRisk.riskScore}</p>
              <RiskBadge level={analysis.deadListingRisk.riskLevel} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ListingOutputCard label="Recommended listing price" value={`$${analysis.recommendedListingPrice.toFixed(2)}`} />
            <ListingOutputCard label="Fast sale price" value={`$${analysis.fastSalePrice.toFixed(2)}`} />
            <ListingOutputCard label="Max value price" value={`$${analysis.maxValuePrice.toFixed(2)}`} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ListingOutputCard label="Best platform" value={`${analysis.bestPlatform.platform} — ${analysis.bestPlatform.reason}`} />
            <RecommendationList title="Fix recommendations" items={analysis.fixRecommendations} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ListingOutputCard label="eBay SEO title (max 80)" value={analysis.ebayTitle} />
            <ListingOutputCard label="Poshmark title" value={analysis.poshmarkTitle} />
            <ListingOutputCard label="Facebook title" value={analysis.facebookTitle} />
            <ListingOutputCard label="Description" value={analysis.description} />
            <ListingOutputCard label="Keywords" value={analysis.keywords.join(', ')} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
