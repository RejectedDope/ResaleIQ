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

const TEXT_FIELDS: [keyof ListingInput, string][] = [
  ['title', 'Item title'],
  ['brand', 'Brand'],
  ['category', 'Category'],
  ['condition', 'Condition'],
  ['size', 'Size'],
  ['color', 'Color'],
  ['material', 'Material'],
  ['platform', 'Current platform'],
  ['notes', 'Risk notes'],
];

const NUMBER_FIELDS: [keyof ListingInput, string][] = [
  ['purchaseCost', 'Purchase cost'],
  ['targetSalePrice', 'Target sale price'],
  ['shippingPaid', 'Shipping paid'],
  ['shippingCharged', 'Shipping charged'],
  ['listingAgeDays', 'Days listed'],
];

function finalDecision(action: string) {
  if (action === 'Donate/Liquidate') return 'LIQUIDATE';
  if (action === 'Reprice') return 'REPRICE';
  if (action === 'Hold') return 'HOLD';
  return 'SELL';
}

function estimatedRoi(input: ListingInput) {
  return Math.round(((input.targetSalePrice - input.purchaseCost - input.shippingPaid) / Math.max(input.purchaseCost, 1)) * 100);
}

export default function AnalyzePage() {
  const [form, setForm] = useState<ListingInput>(INITIAL);
  const [analysis, setAnalysis] = useState<ListingAnalysis | null>(null);

  const update = (key: keyof ListingInput, value: string | number | boolean) => setForm((p) => ({ ...p, [key]: value }));
  const decision = analysis ? finalDecision(analysis.deadListingRisk.recommendedAction) : null;
  const roi = estimatedRoi(form);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Decision Engine</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Decide whether this item should SELL, HOLD, REPRICE, or LIQUIDATE.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Stop guessing. Enter the economics and ResaleIQ turns margin, risk, and platform fit into one money decision.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAnalysis(analyzeListing(form));
          }}
          className="rounded-2xl border border-tan bg-white p-6 shadow-sm"
        >
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Item Intake</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Money inputs</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {TEXT_FIELDS.map(([key, label]) => (
              <label key={key} className={key === 'notes' ? 'text-sm font-bold text-slate-700 md:col-span-2' : 'text-sm font-bold text-slate-700'}>
                {label}
                <input value={String(form[key] ?? '')} onChange={(e) => update(key, e.target.value)} />
              </label>
            ))}

            {NUMBER_FIELDS.map(([key, label]) => (
              <label key={key} className="text-sm font-bold text-slate-700">
                {label}
                <input type="number" min={0} step="0.01" value={Number(form[key])} onChange={(e) => update(key, Number(e.target.value))} />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl bg-ivory px-4 py-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.safetyDocs} onChange={(e) => update('safetyDocs', e.target.checked)} /> Safety docs available
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-ivory px-4 py-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.gradingDescriptors} onChange={(e) => update('gradingDescriptors', e.target.checked)} /> Grading descriptors included
            </label>
          </div>

          <button className="mt-6 w-full bg-[#070A18] text-white hover:bg-[#2B185F]" type="submit">
            Stop Losing Money on This Item
          </button>
        </form>

        <div className="space-y-4">
          {analysis ? (
            <>
              <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">Final Money Decision</p>
                <p className="mt-2 text-6xl font-black tracking-tight md:text-7xl">{decision}</p>
                <p className="mt-3 text-sm font-semibold text-slate-300">
                  Fix now: {analysis.deadListingRisk.recommendedAction} because {analysis.deadListingRisk.topIssue.toLowerCase()}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <ScoreCard title="ROI" value={`${roi}%`} tone={roi < 50 ? 'danger' : 'success'} />
                <ScoreCard title="Profit" value={analysis.profitScore} tone={analysis.profitScore < 50 ? 'danger' : 'success'} />
                <ScoreCard title="Compliance" value={analysis.complianceScore} tone={analysis.complianceScore < 70 ? 'warning' : 'success'} />
                <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Dead Risk</p>
                  <p className="mt-3 text-3xl font-extrabold text-ink">{analysis.deadListingRisk.riskScore}</p>
                  <div className="mt-3"><RiskBadge level={analysis.deadListingRisk.riskLevel} /></div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <ListingOutputCard label="Recover at" value={`$${analysis.recommendedListingPrice.toFixed(2)}`} accent="sage" />
                <ListingOutputCard label="Move fast at" value={`$${analysis.fastSalePrice.toFixed(2)}`} accent="clay" />
                <ListingOutputCard label="Stretch target" value={`$${analysis.maxValuePrice.toFixed(2)}`} accent="violet" />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <ListingOutputCard label="Best money channel" value={`${analysis.bestPlatform.platform}: ${analysis.bestPlatform.reason}`} accent="ink" />
                <ListingOutputCard label="Fix now" value={analysis.deadListingRisk.recommendedAction} accent="sage" />
                <RecommendationList title="Recovery moves" items={analysis.fixRecommendations} />
                <ListingOutputCard label="Money blocker" value={analysis.deadListingRisk.topIssue} accent="clay" />
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] items-center rounded-2xl border border-dashed border-tan bg-white p-8 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Awaiting item</p>
                <h3 className="mt-3 text-3xl font-extrabold text-ink">Enter item economics to get the money decision.</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                  The result will say SELL, HOLD, REPRICE, or LIQUIDATE, then show ROI, risk, price moves, and the fix-now action.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
