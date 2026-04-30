'use client';

import { useMemo, useState } from 'react';
import { RiskBadge } from '@/components/RiskBadge';
import { ScoreCard } from '@/components/ScoreCard';
import { analyzeListing } from '@/lib/listingGenerator';
import { ListingInput } from '@/lib/types';

type InventoryDraft = {
  id: number;
  title: string;
  price: number;
  cost: number;
  platform: string;
  condition: string;
  shipping: number;
};

const STARTER_ITEMS: InventoryDraft[] = [
  { id: 1, title: 'Nike Tech Fleece Joggers Gray Mens Medium', price: 42, cost: 18, platform: 'eBay', condition: 'Pre-owned good', shipping: 7.5 },
  { id: 2, title: 'Coach Leather Crossbody Bag Brown Vintage', price: 58, cost: 24, platform: 'Poshmark', condition: 'Pre-owned fair', shipping: 0 },
  { id: 3, title: 'Lululemon Align Leggings Black Size 6', price: 46, cost: 16, platform: 'Mercari', condition: 'Pre-owned good', shipping: 6.25 },
  { id: 4, title: 'Carhartt Work Jacket Faded Brown Large', price: 64, cost: 32, platform: 'eBay', condition: 'Pre-owned worn', shipping: 10.5 },
  { id: 5, title: 'Madewell High Rise Jeans Blue Size 28', price: 34, cost: 12, platform: 'Poshmark', condition: 'Pre-owned good', shipping: 0 },
];

function toListingInput(item: InventoryDraft, index: number): ListingInput {
  const [brand = 'Unbranded'] = item.title.trim().split(/\s+/);
  const ageSeed = item.title.length + index * 17 + Math.round(item.price);

  return {
    title: item.title,
    brand,
    category: 'Fashion Apparel',
    condition: item.condition,
    size: '',
    color: '',
    material: '',
    purchaseCost: item.cost,
    targetSalePrice: item.price,
    shippingPaid: item.shipping,
    shippingCharged: 0,
    platform: item.platform,
    listingAgeDays: 21 + (ageSeed % 96),
    notes: 'Personal inventory test item',
    safetyDocs: false,
    gradingDescriptors: item.condition.trim().length > 0,
  };
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

function pricingBand(input: ListingInput, riskScore: number) {
  const low = Math.max(6, input.targetSalePrice * (riskScore > 60 ? 0.72 : 0.82));
  const high = input.targetSalePrice * (riskScore > 60 ? 0.96 : 1.08);
  return { low, high };
}

function moneyReason(input: ListingInput, action: string, riskScore: number) {
  if (input.title.trim().length < 35) return 'Title is probably too thin for buyers to find it quickly.';
  if (action === 'Reprice') return 'Current price is above the simulated buyer range for this risk level.';
  if (action === 'Crosslist') return 'Platform fit looks weak, so demand may be sitting somewhere else.';
  if (action === 'Bundle') return 'Shipping pressure is eating margin; bundle or pair with another item.';
  if (action === 'Donate/Liquidate') return 'Expected upside is too small for the time this item may take.';
  if (riskScore > 60) return 'Stale age and competition are pulling the expected sale price down.';
  return 'Small title and price fixes should protect margin without forcing a deep discount.';
}

function optimizedTitle(input: ListingInput) {
  return [input.brand, input.title, input.condition]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryDraft[]>(STARTER_ITEMS);
  const [hasRun, setHasRun] = useState(false);

  const rows = useMemo(() => {
    return items.map((item, index) => {
      const input = toListingInput(item, index);
      const analysis = analyzeListing(input);
      const current = currentOutcome(input, analysis.deadListingRisk.riskScore);
      const fixed = fixedOutcome(input, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore);
      const band = pricingBand(input, analysis.deadListingRisk.riskScore);
      return { item, input, analysis, current, fixed, band };
    });
  }, [items]);

  const prioritized = [...rows].sort((a, b) => {
    if (b.fixed.improvement !== a.fixed.improvement) return b.fixed.improvement - a.fixed.improvement;
    return b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore;
  });
  const topItems = prioritized.slice(0, 5);
  const totalRecoverable = prioritized.reduce((sum, row) => sum + row.fixed.improvement, 0);
  const totalInventoryValue = prioritized.reduce((sum, row) => sum + row.item.price, 0);
  const fixNow = prioritized.filter((row) => row.analysis.deadListingRisk.riskScore >= 30).length;
  const averageRoi = Math.round(prioritized.reduce((sum, row) => sum + row.current.roi, 0) / Math.max(prioritized.length, 1));
  const canAdd = items.length < 20;
  const canRemove = items.length > 5;

  const updateItem = (id: number, key: keyof InventoryDraft, value: string | number) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    setHasRun(false);
  };

  const addItem = () => {
    if (!canAdd) return;
    const nextId = Math.max(...items.map((item) => item.id)) + 1;
    setItems((current) => [
      ...current,
      { id: nextId, title: '', price: 0, cost: 0, platform: 'eBay', condition: '', shipping: 0 },
    ]);
    setHasRun(false);
  };

  const removeItem = (id: number) => {
    if (!canRemove) return;
    setItems((current) => current.filter((item) => item.id !== id));
    setHasRun(false);
  };

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Test My Inventory</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Run recovery analysis on real inventory before adding APIs.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Enter 5 to 20 real items. ResaleIQ uses the current deterministic engine to estimate recoverable money, rank what to fix first, and show the next action.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Current test set</p>
            <p className="mt-2 text-5xl font-black text-[#7AF59A]">{items.length}</p>
            <p className="mt-1 text-sm font-bold text-slate-200">items ready for recovery analysis</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Editable Dataset</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Paste in real items</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addItem} disabled={!canAdd} className="bg-ivory text-ink disabled:opacity-40">
              Add Item
            </button>
            <button type="button" onClick={() => setHasRun(true)} className="bg-[#070A18] text-white hover:bg-[#2B185F]">
              Run Full Recovery Analysis
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-2xl border border-tan/80 bg-ivory p-4 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.9fr_0.7fr_auto]">
              <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Title
                <input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} placeholder={`Item ${index + 1} title`} />
              </label>
              <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Price
                <input type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} />
              </label>
              <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Cost
                <input type="number" min={0} step="0.01" value={item.cost} onChange={(e) => updateItem(item.id, 'cost', Number(e.target.value))} />
              </label>
              <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Platform
                <input value={item.platform} onChange={(e) => updateItem(item.id, 'platform', e.target.value)} />
              </label>
              <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Condition
                <input value={item.condition} onChange={(e) => updateItem(item.id, 'condition', e.target.value)} />
              </label>
              <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Shipping
                <input type="number" min={0} step="0.01" value={item.shipping} onChange={(e) => updateItem(item.id, 'shipping', Number(e.target.value))} />
              </label>
              <button type="button" onClick={() => removeItem(item.id)} disabled={!canRemove} className="self-end bg-white text-red-700 disabled:opacity-30">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {hasRun ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <ScoreCard title="Total Recoverable" value={`+$${totalRecoverable.toFixed(0)}`} helper="Estimated profit improvement if listed fixes are executed." tone="success" />
            <ScoreCard title="Inventory Value" value={`$${totalInventoryValue.toFixed(0)}`} helper="Current target resale value in this test set." tone="dark" />
            <ScoreCard title="Fix Now Items" value={fixNow} helper="Items above the action threshold in this batch." tone={fixNow ? 'danger' : 'neutral'} />
            <ScoreCard title="Current ROI" value={`${averageRoi}%`} helper="Average ROI before recovery fixes." tone={averageRoi < 50 ? 'warning' : 'success'} />
          </div>

          <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Prioritized List</p>
                <h3 className="mt-1 text-2xl font-extrabold text-ink">Top items to fix first</h3>
              </div>
              <p className="text-sm font-bold text-slate-600">Sorted by profit recovery, then risk</p>
            </div>

            <div className="mt-5 space-y-4">
              {topItems.map(({ item, input, analysis, current, fixed, band }, index) => (
                <div key={item.id} className="rounded-2xl border border-tan/80 bg-ivory p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sage">Priority {index + 1}</p>
                      <h4 className="mt-2 text-xl font-extrabold text-ink">{item.title || 'Untitled inventory item'}</h4>
                      <p className="mt-2 text-sm font-bold text-slate-600">{item.platform} - {item.condition || 'Condition missing'} - shipping ${item.shipping.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                      <span className="rounded-full bg-[#070A18] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white">
                        Fix Now: {analysis.deadListingRisk.recommendedAction}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_0.9fr_1fr]">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Outcome</p>
                      <p className="mt-2 text-sm font-bold text-slate-700">Price ${current.price.toFixed(0)}</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">ROI {current.roi}%</p>
                      <p className="mt-1 text-sm font-bold text-red-700">Risk {analysis.deadListingRisk.riskScore}</p>
                    </div>
                    <div className="rounded-2xl bg-[#070A18] p-4 text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix Outcome</p>
                      <p className="mt-2 text-sm font-bold">New price ${fixed.price.toFixed(0)}</p>
                      <p className="mt-1 text-sm font-bold">New ROI {fixed.roi}%</p>
                      <p className="mt-2 text-xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} more profit</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Why this is first</p>
                      <p className="mt-2">{moneyReason(input, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore)}</p>
                      <p className="mt-2">Realistic price band: ${band.low.toFixed(0)}-${band.high.toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#070A18] p-4 text-white">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#7AF59A]">Daily action</p>
                    <p className="mt-2 text-lg font-extrabold">Use title: {optimizedTitle(input)}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-200">
                      Price inside ${band.low.toFixed(0)}-${band.high.toFixed(0)}, then {analysis.deadListingRisk.recommendedAction.toLowerCase()} before sourcing another item.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-tan bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Ready When You Are</p>
          <h3 className="mt-3 text-3xl font-extrabold text-ink">Edit the dataset, then run the recovery analysis.</h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            The output will show total recoverable money, top items to fix, realistic ROI, and an action list a reseller can use during a daily inventory review.
          </p>
        </div>
      )}
    </section>
  );
}
