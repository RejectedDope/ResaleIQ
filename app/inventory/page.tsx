'use client';

import { useMemo, useState } from 'react';
import { analyzeListing } from '@/lib/listingGenerator';
import { ListingInput } from '@/lib/types';

type RawRow = Record<string, unknown>;

const fieldAliases: Record<string, string[]> = {
  title: ['title', 'item', 'item name', 'listing', 'product', 'name', 'description'],
  price: ['price', 'list price', 'sale price', 'sold price', 'ask', 'amount'],
  cost: ['cost', 'bought for', 'buy cost', 'purchase', 'cogs'],
  platform: ['platform', 'marketplace', 'channel', 'site'],
  quantity: ['qty', 'quantity', 'stock', 'units'],
  listingAgeDays: ['age', 'days listed', 'listing age', 'days live'],
  category: ['category', 'type', 'department'],
};

function findMatch(columns: string[], aliases: string[]) {
  const normalized = columns.map((c) => ({ raw: c, low: c.toLowerCase().trim() }));
  for (const alias of aliases) {
    const exact = normalized.find((c) => c.low === alias);
    if (exact) return exact.raw;
    const includes = normalized.find((c) => c.low.includes(alias));
    if (includes) return includes.raw;
  }
  return '';
}

function asNumber(v: unknown, fallback: number) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}


function parseDelimited(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delim = lines[0].includes('	') ? '	' : ',';
  const headers = lines[0].split(delim).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const parts = line.split(delim);
    const row: RawRow = {};
    headers.forEach((h, i) => (row[h || `col_${i}`] = parts[i] ?? ''));
    return row;
  });
}
function toInput(row: RawRow, map: Record<string, string>): ListingInput {
  const title = String(row[map.title] ?? 'Untitled inventory item').trim();
  const price = asNumber(row[map.price], 0);
  const cost = asNumber(row[map.cost], Math.max(1, price * 0.35));
  const age = asNumber(row[map.listingAgeDays], 30);
  return {
    title,
    brand: '',
    category: String(row[map.category] ?? 'General').trim() || 'General',
    condition: 'Used',
    size: 'OS',
    color: '',
    material: '',
    purchaseCost: cost,
    targetSalePrice: Math.max(1, price || cost * 1.8),
    shippingPaid: 0,
    shippingCharged: 0,
    platform: String(row[map.platform] ?? 'eBay').trim() || 'eBay',
    listingAgeDays: Math.max(0, age),
    notes: 'Imported from flexible intake.',
    safetyDocs: false,
    gradingDescriptors: false,
    impressions: 400,
    clicks: 4,
    salesCount: 0,
    daysSinceEngagement: Math.min(45, Math.max(1, Math.round(age / 2))),
    daysSinceSale: Math.min(60, Math.max(3, Math.round(age * 0.7))),
    impressionTrend7d: -30,
    adPerformanceDecline: 35,
    pricingCompetitiveness: 60,
    itemSpecificsCompleteness: 55,
    titleOptimization: 55,
    imageQuality: 55,
  };
}

export default function InventoryPage() {
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({ title: '', price: '', cost: '', platform: '', quantity: '', listingAgeDays: '', category: '' });
  const [pastedText, setPastedText] = useState('');
  const [message, setMessage] = useState('Upload spreadsheets, screenshots, item photos, or pasted text. Messy inventory is okay.');

  const canAnalyze = mapping.title && (mapping.price || mapping.cost) && rawRows.length > 0;
  const normalized = useMemo(() => canAnalyze ? rawRows.map((r) => toInput(r, mapping)) : [], [rawRows, mapping, canAnalyze]);
  const analyses = normalized.map((item) => ({ item, analysis: analyzeListing(item) }));
  const recoverableRevenue = analyses.reduce((sum, row) => sum + row.item.targetSalePrice, 0);

  async function handleFile(file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseDelimited(text);
      if (rows.length) hydrateRows(rows);
      else setMessage('We found inventory data but need help matching a few fields.');
    } catch {
      setMessage('We found inventory data but need help matching a few fields.');
    }
  }

  function hydrateRows(rows: RawRow[]) {
    const nextCols = Object.keys(rows[0] ?? {});
    setRawRows(rows);
    setColumns(nextCols);
    const auto: Record<string, string> = { title: '', price: '', cost: '', platform: '', quantity: '', listingAgeDays: '', category: '' };
    for (const key of Object.keys(auto)) auto[key] = findMatch(nextCols, fieldAliases[key]);
    setMapping(auto);
    setMessage("We found possible inventory data. Let's confirm the fields.");
  }

  function parsePastedText() {
    const lines = pastedText.split('\n').map((x) => x.trim()).filter(Boolean);
    const rows = lines.map((line) => ({ title: line }));
    if (rows.length) hydrateRows(rows);
  }

  return <section className="space-y-6">
    <h1 className="text-3xl font-extrabold">Inventory Intake + Recovery Actions</h1>
    <p className="text-sm text-slate-300">{message}</p>

    <div className="grid gap-4 md:grid-cols-2">
      <label className="rounded-2xl border border-dashed border-[#3A4258] bg-[#121722] p-4 text-sm font-bold">Upload Spreadsheet, Screenshot, or Item Photos
        <input className="mt-3" type="file" accept=".csv,.xlsx,.xls,image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
      </label>
      <div className="rounded-2xl border border-[#2A3144] bg-[#121722] p-4">
        <p className="text-sm font-bold">Paste text or notes</p>
        <textarea className="mt-2" rows={4} value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Paste titles, handwritten notes, or messy exports..." />
        <button type="button" onClick={parsePastedText} className="mt-2 bg-[#D6BA7A] text-[#0A0D14]">Detect inventory from text</button>
      </div>
    </div>

    {columns.length ? <div className="rounded-2xl border border-[#2A3144] bg-[#0E1320] p-4">
      <p className="text-sm font-bold">Confirm detected fields</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {Object.keys(mapping).map((field) => <label key={field} className="text-xs uppercase tracking-[0.1em]">{field}
          <select value={mapping[field]} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}>
            <option value="">Not sure yet</option>
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>)}
      </div>
    </div> : null}

    {canAnalyze ? <div className="rounded-2xl border border-[#2A3144] bg-[#0E1320] p-4">
      <p className="font-bold">Profit Opportunity: ${recoverableRevenue.toFixed(0)}</p>
      <div className="mt-3 space-y-2">
        {analyses.slice(0, 12).map(({ item, analysis }) => <div key={item.title} className="rounded-xl border border-[#2A3144] bg-[#121722] p-3">
          <p className="font-bold">{item.title}</p>
          <p className="text-sm">Action Needed: {analysis.deadListingRisk.recommendedAction} · Recovery Priority {analysis.deadListingRisk.recoveryPriority}</p>
          <p className="text-sm">Inventory Health {analysis.deadListingRisk.listingHealthScore} · Top issue: {analysis.deadListingRisk.topIssue}</p>
        </div>)}
      </div>
    </div> : null}
  </section>;
}
