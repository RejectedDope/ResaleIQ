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

const KNOWN_BRANDS = [
  'Coach',
  'Nike',
  'Lululemon',
  'Carhartt',
  'Madewell',
  'Patagonia',
  'Levi',
  'Levis',
  'Adidas',
  'Ralph Lauren',
  'The North Face',
  'Free People',
  'Anthropologie',
  'Vans',
  'Dr Martens',
  'Birkenstock',
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

function categoryFromTitle(title: string) {
  const text = title.toLowerCase();
  if (/bag|purse|crossbody|tote|wallet|backpack|satchel/.test(text)) return 'Bags';
  if (/shoe|sneaker|boot|heel|loafer|sandal|clog/.test(text)) return 'Shoes';
  if (/jean|legging|pant|jogger|short|skirt/.test(text)) return 'Fashion Apparel';
  if (/jacket|coat|hoodie|sweater|shirt|dress|blazer|fleece|top/.test(text)) return 'Fashion Apparel';
  if (/watch|ring|necklace|bracelet|earring|jewelry/.test(text)) return 'Jewelry';
  if (/console|camera|phone|tablet|headphone|speaker|electronics/.test(text)) return 'Electronics';
  if (/coin|card|comic|vintage|collectible|figure/.test(text)) return 'Collectibles';
  if (/chair|table|desk|dresser|furniture|local/.test(text)) return 'Furniture / Local';
  return 'Fashion Apparel';
}

function brandFromTitle(title: string) {
  const normalized = title.toLowerCase();
  const brand = KNOWN_BRANDS.find((candidate) => normalized.includes(candidate.toLowerCase()));
  if (brand) return brand === 'Levis' ? "Levi's" : brand;
  return title.trim().split(/\s+/)[0] || '';
}

function priceContextMultiplier(input: ListingInput) {
  const category = input.category.toLowerCase();
  const brand = input.brand.toLowerCase();
  let multiplier = 1;

  if (['coach', 'lululemon', 'patagonia', 'carhartt', 'the north face'].some((term) => brand.includes(term))) multiplier += 0.06;
  if (category.includes('bags') || category.includes('shoes') || category.includes('collectible')) multiplier += 0.04;
  if (category.includes('furniture')) multiplier -= 0.05;

  return multiplier;
}

function marketSignals(input: ListingInput, riskScore: number) {
  const multiplier = priceContextMultiplier(input);
  const low = Math.max(6, input.targetSalePrice * (riskScore > 60 ? 0.72 : 0.82) * multiplier);
  const high = input.targetSalePrice * (riskScore > 60 ? 0.96 : 1.08) * multiplier;
  const similarCount = Math.max(18, Math.round(42 + input.title.length / 2 + input.listingAgeDays / 4 + (input.brand ? 8 : 0)));
  const daysToSell = Math.max(9, Math.round(18 + riskScore / 3 + (input.targetSalePrice < 25 ? 8 : 0)));
  const competition = similarCount > 85 ? 'High competition' : similarCount > 55 ? 'Medium competition' : 'Low competition';
  const confidence = input.brand && input.category ? (riskScore < 65 ? 'High' : 'Medium') : riskScore < 35 ? 'High' : riskScore < 65 ? 'Medium' : 'Low';

  return { low, high, similarCount, daysToSell, competition, confidence };
}

function moneyExplanation(input: ListingInput, action: string, riskScore: number) {
  if (input.title.trim().length < 35) return 'Low visibility due to a weak title; buyers may not be finding this item.';
  if (action === 'Reprice') return `${input.brand || 'This brand'} ${input.category.toLowerCase()} pricing is above the simulated market band for current demand.`;
  if (action === 'Crosslist') return `${input.category} buyers may be stronger on another channel than ${input.platform}.`;
  if (action === 'Bundle') return 'Low-ticket margin improves when shipping and handling are spread across a bundle.';
  if (action === 'Donate/Liquidate') return 'Weak margin and stale age make recovery time more expensive than the upside.';
  if (riskScore > 60) return 'Competing listings are likely priced lower, and age is dragging down expected sale price.';
  return 'A cleaner title and pricing reset should improve buyer confidence without inflating the price.';
}

function optimizedTitle(input: ListingInput) {
  return [input.brand, input.title, input.condition]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function keyChanges(input: ListingInput, action: string, signals: ReturnType<typeof marketSignals>) {
  return [
    `Price this ${input.category.toLowerCase()} inside the $${signals.low.toFixed(0)}-$${signals.high.toFixed(0)} market band.`,
    `Use title: ${optimizedTitle(input)}.`,
    action === 'Crosslist' ? `Move or duplicate the listing to the stronger ${input.category.toLowerCase()} buyer channel.` : `Execute action: ${action}.`,
  ];
}

export default function AnalyzePage() {
  const [form, setForm] = useState<ListingInput>(INITIAL);
  const [analysis, setAnalysis] = useState<ListingAnalysis | null>(null);
  const [editingDetection, setEditingDetection] = useState(false);

  const update = (key: keyof ListingInput, value: string | number | boolean) => setForm((p) => ({ ...p, [key]: value }));
  const updateTitle = (value: string) => setForm((p) => ({ ...p, title: value, brand: brandFromTitle(value), category: categoryFromTitle(value) }));
  const decision = analysis ? finalDecision(analysis.deadListingRisk.recommendedAction) : null;
  const current = analysis ? currentOutcome(form, analysis.deadListingRisk.riskScore) : null;
  const fixed = analysis ? fixedOutcome(form, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore) : null;
  const signals = analysis ? marketSignals(form, analysis.deadListingRisk.riskScore) : null;

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Decision Engine</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Tell us what's happening with this item.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Enter the handful of details a reseller already knows. ResaleIQ detects brand and category from the title, then turns price, cost, age, shipping, and platform fit into one money decision.
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Quick Item Check</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">What's going on with this item?</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">No catalog cleanup. Brand and category are detected quietly from the title.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-slate-700 md:col-span-2">
              Item title
              <input value={form.title} onChange={(e) => updateTitle(e.target.value)} placeholder="Coach leather crossbody bag brown" />
            </label>

            <div className="rounded-2xl bg-ivory p-4 md:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-2">
                  <p>Brand: <span className="text-ink">{form.brand || 'Unknown'}</span> <span className="text-sage">(detected)</span></p>
                  <p>Category: <span className="text-ink">{form.category}</span> <span className="text-sage">(detected)</span></p>
                </div>
                <button type="button" onClick={() => setEditingDetection((value) => !value)} className="bg-white text-ink">
                  Edit Detection
                </button>
              </div>

              {editingDetection ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-bold text-slate-700">
                    Brand override
                    <input value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="Coach" />
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Category override
                    <input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="Bags" />
                  </label>
                </div>
              ) : null}
            </div>

            <label className="text-sm font-bold text-slate-700">
              What you paid
              <input type="number" min={0} step="0.01" value={form.purchaseCost} onChange={(e) => update('purchaseCost', Number(e.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Current price
              <input type="number" min={0} step="0.01" value={form.targetSalePrice} onChange={(e) => update('targetSalePrice', Number(e.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Platform
              <input value={form.platform} onChange={(e) => update('platform', e.target.value)} placeholder="eBay, Poshmark, Mercari" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Condition
              <input value={form.condition} onChange={(e) => update('condition', e.target.value)} placeholder="pre-owned good" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Shipping
              <input type="number" min={0} step="0.01" value={form.shippingPaid} onChange={(e) => update('shippingPaid', Number(e.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Days live
              <input type="number" min={0} step="1" value={form.listingAgeDays} onChange={(e) => update('listingAgeDays', Number(e.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-700 md:col-span-2">
              Optional notes
              <input value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Low watchers, lots of likes, no offers, damaged box..." />
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
                  <p className="mt-3 text-lg font-extrabold text-ink">{form.brand || 'Similar'} {form.category.toLowerCase()} selling between ${signals.low.toFixed(0)}-${signals.high.toFixed(0)}</p>
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
                <h3 className="mt-3 text-3xl font-extrabold text-ink">Tell us what's happening to get the money decision.</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                  Add title, price, cost, shipping, days live, and platform. ResaleIQ detects brand and category, then shows the current outcome, after-fix outcome, profit increase, and exact next action.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
