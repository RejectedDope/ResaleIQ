'use client';

import { useMemo, useState } from 'react';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';
import { ListingInput } from '@/lib/types';

type ItemRow = {
  id: string;
  title: string;
  price: number;
  cost: number;
  platform: string;
  listingAgeDays: number;
  impressions: number;
  clicks: number;
  salesCount: number;
  daysSinceEngagement: number;
  daysSinceSale: number;
  status: 'active' | 'pending' | 'completed';
};

const STARTER: ItemRow[] = sampleInventory.map((item, index) => ({
  id: `sample-${index + 1}`,
  title: item.title,
  price: item.targetSalePrice,
  cost: item.purchaseCost,
  platform: item.platform,
  listingAgeDays: item.listingAgeDays,
  impressions: item.impressions,
  clicks: item.clicks,
  salesCount: item.salesCount,
  daysSinceEngagement: item.daysSinceEngagement,
  daysSinceSale: item.daysSinceSale,
  status: 'active',
}));

function toListingInput(row: ItemRow): ListingInput {
  return {
    title: row.title,
    brand: 'Unknown',
    category: 'General',
    condition: 'Used',
    size: 'OS',
    color: 'Mixed',
    material: 'Unknown',
    purchaseCost: row.cost,
    targetSalePrice: row.price,
    shippingPaid: 0,
    shippingCharged: 0,
    platform: row.platform,
    listingAgeDays: row.listingAgeDays,
    notes: '',
    safetyDocs: false,
    gradingDescriptors: false,
    impressions: row.impressions,
    clicks: row.clicks,
    salesCount: row.salesCount,
    daysSinceEngagement: row.daysSinceEngagement,
    daysSinceSale: row.daysSinceSale,
    impressionTrend7d: row.listingAgeDays > 30 ? -50 : -15,
    adPerformanceDecline: row.listingAgeDays > 60 ? 60 : 25,
    pricingCompetitiveness: 65,
    itemSpecificsCompleteness: 70,
    titleOptimization: 65,
    imageQuality: 65,
  };
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemRow[]>(STARTER);
  const [message, setMessage] = useState('');

  const rows = useMemo(
    () =>
      items.map((item) => {
        const analysis = analyzeListing(toListingInput(item));
        return { item, analysis };
      }),
    [items],
  );

  const activeRows = rows.filter((row) => row.item.status === 'active');
  const pendingRows = rows.filter((row) => row.item.status === 'pending');
  const completedRows = rows.filter((row) => row.item.status === 'completed');
  const topItems = [...activeRows]
    .sort((a, b) => b.analysis.deadListingRisk.recoveryPriority - a.analysis.deadListingRisk.recoveryPriority)
    .slice(0, 5);

  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.price, 0);
  const averageHealth = Math.round(
    rows.reduce((sum, row) => sum + row.analysis.deadListingRisk.listingHealthScore, 0) / Math.max(rows.length, 1),
  );

  function updateItem(id: string, key: keyof ItemRow, value: string | number) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateStatus(id: string, status: ItemRow['status']) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: `manual-${Date.now()}`,
        title: '',
        price: 0,
        cost: 0,
        platform: 'eBay',
        listingAgeDays: 0,
        impressions: 0,
        clicks: 0,
        salesCount: 0,
        daysSinceEngagement: 0,
        daysSinceSale: 0,
        status: 'active',
      },
    ]);
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").map((l) => l.replace("\r", "")).filter(Boolean);
    if (lines.length < 2) {
      setMessage('No valid rows detected in file.');
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const imported: ItemRow[] = lines.slice(1).map((line, index) => {
      const cols = line.split(',').map((c) => c.trim());
      const get = (name: string) => cols[headers.indexOf(name)] ?? '';
      return {
        id: `import-${Date.now()}-${index}`,
        title: get('title'),
        price: Number(get('price') || 0),
        cost: Number(get('cost') || 0),
        platform: get('platform') || 'eBay',
        listingAgeDays: Number(get('listingagedays') || 0),
        impressions: Number(get('impressions') || 0),
        clicks: Number(get('clicks') || 0),
        salesCount: Number(get('salescount') || 0),
        daysSinceEngagement: Number(get('dayssinceengagement') || 0),
        daysSinceSale: Number(get('dayssincesale') || 0),
        status: 'active' as const,
      };
    }).filter((row) => row.title || row.price > 0);
    if (!imported.length) {
      setMessage('No valid rows detected in file.');
      return;
    }
    setItems((current) => [...current, ...imported]);
    setMessage(`Imported ${imported.length} inventory rows.`);
  }


  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[#1C2440] bg-[#070A18] p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7AF59A]">Inventory Intelligence</p>
        <h1 className="mt-2 text-3xl font-extrabold">Dead Inventory Recovery Engine</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Recoverable Revenue" value={`$${recoverableRevenue.toFixed(0)}`} />
        <Metric label="Average Health" value={`${averageHealth}/100`} />
        <Metric label="Active" value={`${activeRows.length}`} />
        <Metric label="Pending" value={`${pendingRows.length}`} />
      </div>

      <div className="rounded-2xl border border-tan bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <label className="rounded-xl border px-3 py-2 text-sm font-bold">
            Upload inventory
            <input className="ml-2" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          <button onClick={addItem} className="rounded-xl bg-[#070A18] px-4 py-2 text-sm font-bold text-white">Add Item</button>
        </div>
        {message ? <p className="mt-2 text-sm font-semibold text-slate-700">{message}</p> : null}
      </div>

      <div className="rounded-2xl border border-tan bg-white p-4">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">Stale Inventory Analysis</p>
        <div className="mt-3 space-y-2">
          {topItems.map(({ item, analysis }) => (
            <div key={item.id} className="rounded-xl border p-3">
              <p className="font-bold">{item.title || 'Untitled item'}</p>
              <p className="text-sm">Decay {analysis.deadListingRisk.decayScore} • Exposure {analysis.deadListingRisk.exposureScore} • Health {analysis.deadListingRisk.listingHealthScore}</p>
              <p className="text-sm">Lifecycle {analysis.deadListingRisk.lifecycleStage} • Recovery Priority {analysis.deadListingRisk.recoveryPriority}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => updateStatus(item.id, 'completed')} className="rounded border px-2 py-1 text-xs">Mark Fixed</button>
                <button onClick={() => updateStatus(item.id, 'pending')} className="rounded border px-2 py-1 text-xs">Set Pending</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-tan bg-white p-4">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">Item Table</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr><th>Title</th><th>Price</th><th>Cost</th><th>Platform</th><th>Age</th><th>Impr.</th><th>Clicks</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td><input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} /></td>
                  <td><input type="number" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} /></td>
                  <td><input type="number" value={item.cost} onChange={(e) => updateItem(item.id, 'cost', Number(e.target.value))} /></td>
                  <td><input value={item.platform} onChange={(e) => updateItem(item.id, 'platform', e.target.value)} /></td>
                  <td><input type="number" value={item.listingAgeDays} onChange={(e) => updateItem(item.id, 'listingAgeDays', Number(e.target.value))} /></td>
                  <td><input type="number" value={item.impressions} onChange={(e) => updateItem(item.id, 'impressions', Number(e.target.value))} /></td>
                  <td><input type="number" value={item.clicks} onChange={(e) => updateItem(item.id, 'clicks', Number(e.target.value))} /></td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-slate-600">Completed: {completedRows.length}</p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-tan bg-white p-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>;
}
