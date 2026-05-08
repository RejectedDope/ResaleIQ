'use client';

import { useState } from 'react';
import { analyzeListing } from '@/lib/listingGenerator';
import { ListingInput } from '@/lib/types';

const initial: ListingInput = {
  title: 'Coach Legacy Leather Tote Bag Brown Turnlock Shoulder Purse',
  brand: 'Coach', category: 'Fashion Accessories', condition: 'Good pre-owned condition', size: 'One Size', color: 'Brown', material: 'Leather', purchaseCost: 22, targetSalePrice: 92, shippingPaid: 9, shippingCharged: 8, platform: 'eBay', listingAgeDays: 86, notes: '', safetyDocs: false, gradingDescriptors: false,
  impressions: 820, clicks: 5, salesCount: 0, daysSinceEngagement: 18, daysSinceSale: 44, impressionTrend7d: -76, adPerformanceDecline: 62, pricingCompetitiveness: 64, itemSpecificsCompleteness: 72, titleOptimization: 68, imageQuality: 66,
};

export default function AnalyzePage() {
  const [form, setForm] = useState<ListingInput>(initial);
  const [result, setResult] = useState(() => analyzeListing(initial));
  const update = (k: keyof ListingInput, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return <section className="space-y-6">
    <h1 className="text-3xl font-extrabold">Inventory Recovery Check</h1>
    <form className="grid gap-3 md:grid-cols-3" onSubmit={(e)=>{e.preventDefault();setResult(analyzeListing(form));}}>
      <input value={form.title} onChange={(e)=>update('title', e.target.value)} placeholder="Title" />
      <input type="number" value={form.targetSalePrice} onChange={(e)=>update('targetSalePrice', Number(e.target.value))} placeholder="Price" />
      <input type="number" value={form.listingAgeDays} onChange={(e)=>update('listingAgeDays', Number(e.target.value))} placeholder="Listing age" />
      <input type="number" value={form.impressions} onChange={(e)=>update('impressions', Number(e.target.value))} placeholder="Impressions" />
      <input type="number" value={form.clicks} onChange={(e)=>update('clicks', Number(e.target.value))} placeholder="Clicks" />
      <input type="number" value={form.daysSinceSale} onChange={(e)=>update('daysSinceSale', Number(e.target.value))} placeholder="Days since sale" />
      <button type="submit" className="bg-[#070A18] text-white p-3 rounded">Run Check</button>
    </form>
    <div className="rounded-2xl border p-4">
      <p>Decay Score: {result.deadListingRisk.decayScore}</p>
      <p>Exposure Score: {result.deadListingRisk.exposureScore}</p>
      <p>Listing Health: {result.deadListingRisk.listingHealthScore}</p>
      <p>Lifecycle Stage: {result.deadListingRisk.lifecycleStage}</p>
      <p>Recovery Priority: {result.deadListingRisk.recoveryPriority}</p>
    </div>
  </section>;
}
