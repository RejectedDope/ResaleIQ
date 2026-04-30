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

function baseProfit(input: ListingInput, price: number) {
  return price + input.shippingCharged - input.purchaseCost - input.shippingPaid;
}

function currentOutcome(input: ListingInput, riskScore: number) {
  const riskDiscount = Math.min(0.3, riskScore * 0.003);
  const price = input.targetSalePrice * (1 - riskDiscount);
  const profit = baseProfit(input, price);
  return {
    price,
    profit,
    roi: Math.round((profit / Math.max(input.purchaseCost, 1)) * 100),
  };
}

function fixedOutcome(input: ListingInput, action: string, riskScore: number) {
  const current = currentOutcome(input, riskScore);
  const liftByAction: Record<string, number> = {
    Relist: 0.08,
    Reprice: 0.06,
    Crosslist: 0.1,
    Bundle: 0.12,
    Hold: 0.03,
    'Donate/Liquidate': 0.04,
  };
  const lift = liftByAction[action] ?? 0.06;
  const price = Math.min(input.targetSalePrice * 1.12, current.price + input.targetSalePrice * lift);
  const profit = baseProfit(input, price);
  return {
    price,
    profit,
    roi: Math.round((profit / Math.max(input.purchaseCost, 1)) * 100),
    improvement: Math.max(0, profit - current.profit),
  };
}

function marketSignals(input: ListingInput, riskScore: number) {
  const low = Math.max(6, input.targetSalePrice * (riskScore > 60 ? 0.72 : 0.82));
  const high = input.targetSalePrice * (riskScore > 60 ? 0.96 : 1.08);
  const similarCount = Math.max(18, Math.round(42 + input.title.length / 2 + input.listingAgeDays / 4));
  const daysToSell = Math.max(9, Math.round(18 + riskScore / 3 + (input.targetSalePrice < 25 ? 8 : 0)));
  const competition = similarCount > 85 ? 'High competition' : similarCount > 55 ? 'Medium competition' : 'Low competition';
  const confidence = riskScore < 35 ? 'High' : riskScore < 65 ? 'Medium' : 'Low';

  return { low, high, similarCount, daysToSell, competition, confidence };
}

function moneyExplanation(input: ListingInput, action: string, riskScore: number) {
  if (input.title.trim().length < 35) return 'Low visibility due to a weak title; buyers may not be finding this item.';
  if (action === 'Reprice') return 'Price is above the simulated market band for the current demand level.';
  if (action === 'Crosslist') return 'The item has buyers, but the current platform is limiting demand.';
  if (action === 'Bundle') return 'Low-ticket margin improves when shipping and handling are spread across a bundle.';
  if (action === 'Donate/Liquidate') return 'Weak margin and stale age make recovery time more expensive than the upside.';
  if (riskScore > 60) return 'Competing listings are likely priced lower, and age is dragging down expected sale price.';
  return 'A cleaner title and pricing reset should improve buyer confidence without inflating the price.';
}

function optimizedTitle(input: ListingInput) {
  return [input.brand, input.title, input.size && input.size !== 'OS' ? input.size : '', input.color]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function keyChanges(input: ListingInput, action: string, signals: ReturnType<typeof marketSignals>) {
  return [
    `List inside the $${signals.low.toFixed(0)}-$${signals.high.toFixed(0)} market band.`,
    `Use title: ${optimizedTitle(input)}.`,
    action === 'Crosslist' ? 'Move or duplicate the listing to the stronger buyer channel.' : `Execute action: ${action}.`,
  ];
}

export default function AnalyzePage() {
  const [form, setForm] = useState<ListingInput>(INITIAL);
  const [analysis, setAnalysis] = useState<ListingAnalysis | null>(null);

  const update = (key: keyof ListingInput, value: string | number | boolean) => setForm((p) => ({ ...p, [key]: value }));
  const decision = analysis ? finalDecision(analysis.deadListingRisk.recommendedAction) : null;
  const current = analysis ? currentOutcome(form, analysis.deadListingRisk.riskScore) : null;
  const fixed = analysis ? fixedOutcome(form, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore) : null;
  const signals = analysis ? marketSignals(form, analysis.deadListingRisk.riskScore) : null;

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Decision Engine</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Decide whether this item should SELL, HOLD, REPRICE, or LIQUIDATE.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Stop guessing. Enter the economics and ResaleIQ turns margin, risk, market signals, and platform fit into one money decision.
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
          {analysis && current && fixed && signals ? (
            <>
              <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">Final Money Decision</p>
                <p className="mt-2 text-6xl font-black tracking-tight md:text-7xl">{decision}</p>
                <p className="mt-3 text-3xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} more profit if you fix this</p>
                <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-slate-200">
                  {moneyExplanation(form, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore)}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Current Outcome</p>
                  <p className="mt-3 text-2xl font-extrabold text-ink">Price ${current.price.toFixed(0)}</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">ROI {current.roi}%</p>
                  <p className="mt-2 text-sm font-bold text-red-700">Risk {analysis.deadListingRisk.riskScore}</p>
                </div>
                <div className="rounded-2xl border border-[#070A18] bg-[#070A18] p-6 text-white shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">After Fix Outcome</p>
                  <p className="mt-3 text-2xl font-extrabold">New price ${fixed.price.toFixed(0)}</p>
                  <p className="mt-2 text-sm font-bold">New ROI {fixed.roi}%</p>
                  <p className="mt-2 text-xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} profit gap</p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Market Signals</p>
                  <p className="mt-3 text-lg font-extrabold text-ink">Similar items selling between ${signals.low.toFixed(0)}-${signals.high.toFixed(0)}</p>
                  <div className="mt-4 grid gap-3 text-sm font-bold text-slate-700 md:grid-cols-2">
                    <p className="rounded-2xl bg-ivory px-4 py-3">Average days to sell: {signals.daysToSell}</p>
                    <p className="rounded-2xl bg-ivory px-4 py-3">{signals.competition}</p>
                    <p className="rounded-2xl bg-ivory px-4 py-3">Based on {signals.similarCount} similar listings</p>
                    <p className="rounded-2xl bg-ivory px-4 py-3">Confidence: {signals.confidence}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#070A18] p-6 text-white shadow-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Fix This Listing</p>
                  <p className="mt-2 text-2xl font-extrabold">{analysis.deadListingRisk.recommendedAction}</p>
                  <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold leading-6 text-slate-200">Optimized title: {optimizedTitle(form)}</p>
                  <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-200">
                    {keyChanges(form, analysis.deadListingRisk.recommendedAction, signals).map((change) => (
                      <li key={change}>- {change}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <ScoreCard title="New ROI" value={`${fixed.roi}%`} tone={fixed.roi < 50 ? 'danger' : 'success'} />
                <ScoreCard title="Profit" value={analysis.profitScore} tone={analysis.profitScore < 50 ? 'danger' : 'success'} />
                <ScoreCard title="Compliance" value={analysis.complianceScore} tone={analysis.complianceScore < 70 ? 'warning' : 'success'} />
                <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Dead Risk</p>
                  <p className="mt-3 text-3xl font-extrabold text-ink">{analysis.deadListingRisk.riskScore}</p>
                  <div className="mt-3"><RiskBadge level={analysis.deadListingRisk.riskLevel} /></div>
                </div>
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
                  The result will show current outcome, after-fix outcome, profit increase, market context, confidence, and the exact next action.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
