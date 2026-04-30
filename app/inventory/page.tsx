'use client';

import { type DragEvent, useMemo, useState } from 'react';
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

type ParsedRow = Record<string, string | number | boolean | null | undefined>;
type InventoryField = 'title' | 'price' | 'cost' | 'platform' | 'condition' | 'shipping';
type ColumnMap = Record<InventoryField, string>;

const MAX_IMPORT_ROWS = 100;
const REQUIRED_FIELDS: InventoryField[] = ['title', 'price'];

const INVENTORY_FIELDS: { key: InventoryField; label: string; required?: boolean }[] = [
  { key: 'title', label: 'Title', required: true },
  { key: 'price', label: 'Price', required: true },
  { key: 'cost', label: 'Cost' },
  { key: 'platform', label: 'Platform' },
  { key: 'condition', label: 'Condition' },
  { key: 'shipping', label: 'Shipping' },
];

const STARTER_ITEMS: InventoryDraft[] = [
  { id: 1, title: 'Nike Tech Fleece Joggers Gray Mens Medium', price: 42, cost: 18, platform: 'eBay', condition: 'Pre-owned good', shipping: 7.5 },
  { id: 2, title: 'Coach Leather Crossbody Bag Brown Vintage', price: 58, cost: 24, platform: 'Poshmark', condition: 'Pre-owned fair', shipping: 0 },
  { id: 3, title: 'Lululemon Align Leggings Black Size 6', price: 46, cost: 16, platform: 'Mercari', condition: 'Pre-owned good', shipping: 6.25 },
  { id: 4, title: 'Carhartt Work Jacket Faded Brown Large', price: 64, cost: 32, platform: 'eBay', condition: 'Pre-owned worn', shipping: 10.5 },
  { id: 5, title: 'Madewell High Rise Jeans Blue Size 28', price: 34, cost: 12, platform: 'Poshmark', condition: 'Pre-owned good', shipping: 0 },
];

const EMPTY_MAPPING: ColumnMap = {
  title: '',
  price: '',
  cost: '',
  platform: '',
  condition: '',
  shipping: '',
};

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '').replace(/[$,]/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeCondition(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function normalizePlatform(value: unknown) {
  const platform = normalizeText(value);
  return platform || 'eBay';
}

function normalizeColumnName(column: string) {
  return column.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferMapping(columns: string[]): ColumnMap {
  const normalized = columns.map((column) => ({ column, key: normalizeColumnName(column) }));
  const find = (...needles: string[]) => normalized.find(({ key }) => needles.some((needle) => key.includes(needle)))?.column ?? '';

  return {
    title: find('title', 'itemtitle', 'itemname', 'item', 'name', 'description', 'product'),
    price: find('listprice', 'listingprice', 'saleprice', 'askingprice', 'askprice', 'price'),
    cost: find('purchasecost', 'purchaseprice', 'buyprice', 'buycost', 'itemcost', 'cost', 'cogs'),
    platform: find('platform', 'marketplace', 'channel', 'site', 'sellingsite'),
    condition: find('condition', 'itemcondition', 'grade'),
    shipping: find('shippingcost', 'shippingpaid', 'shipcost', 'ship', 'postage', 'shipping'),
  };
}

function summarizeRows(rows: ParsedRow[], mapping: ColumnMap) {
  const limitedRows = rows.slice(0, MAX_IMPORT_ROWS);
  const titleMissing = !mapping.title ? limitedRows.length : limitedRows.filter((row) => !normalizeText(row[mapping.title])).length;
  const invalidPrices = !mapping.price ? limitedRows.length : limitedRows.filter((row) => toNumber(row[mapping.price]) <= 0).length;
  const missingOptional = (['cost', 'platform', 'condition', 'shipping'] as InventoryField[]).filter((field) => !mapping[field]).length;

  return {
    importedRows: limitedRows.length,
    skippedRows: Math.max(0, rows.length - MAX_IMPORT_ROWS),
    titleMissing,
    invalidPrices,
    missingOptional,
    ready: Boolean(mapping.title && mapping.price && titleMissing === 0 && invalidPrices === 0 && limitedRows.length > 0),
  };
}

function cleanRows(rows: ParsedRow[], mapping: ColumnMap) {
  const warnings: string[] = [];
  const usableRows = rows.slice(0, MAX_IMPORT_ROWS);
  const items = usableRows.map((row, index) => {
    const title = normalizeText(row[mapping.title]);
    const price = toNumber(row[mapping.price]);
    const cost = toNumber(row[mapping.cost]);
    const shipping = toNumber(row[mapping.shipping]);
    const platform = normalizePlatform(row[mapping.platform]);
    const condition = normalizeCondition(row[mapping.condition]) || 'condition missing';

    if (!mapping.cost) warnings.push('Cost column is not mapped; missing costs were treated as $0.');
    if (!mapping.platform) warnings.push('Platform column is not mapped; eBay was used as the default platform.');
    if (!mapping.condition) warnings.push('Condition column is not mapped; condition missing was used.');
    if (!mapping.shipping) warnings.push('Shipping column is not mapped; missing shipping was treated as $0.');

    return { id: index + 1, title, price, cost, platform, condition, shipping };
  });

  if (rows.length > MAX_IMPORT_ROWS) warnings.push(`Only the first ${MAX_IMPORT_ROWS} rows were imported for this MVP test run.`);
  if (items.length < 5) warnings.push('Fewer than 5 rows were imported. Results still run, but a larger sample is more useful.');

  return { items, warnings: Array.from(new Set(warnings)) };
}

function summarizeItems(items: InventoryDraft[]) {
  return {
    total: items.length,
    missingTitles: items.filter((item) => !item.title.trim()).length,
    invalidPrices: items.filter((item) => item.price <= 0).length,
  };
}

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

async function parseInventoryFile(file: File) {
  const XLSX = await import('xlsx');
  const extension = file.name.split('.').pop()?.toLowerCase();
  const workbook = extension === 'csv'
    ? XLSX.read(await file.text(), { type: 'string' })
    : XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ParsedRow>(firstSheet, { defval: '' });
  const columns = Object.keys(rows[0] ?? {});

  return { rows, columns };
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryDraft[]>(STARTER_ITEMS);
  const [hasRun, setHasRun] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMap>(EMPTY_MAPPING);
  const [warnings, setWarnings] = useState<string[]>([]);

  const mappingSummary = useMemo(() => summarizeRows(parsedRows, mapping), [parsedRows, mapping]);
  const itemSummary = useMemo(() => summarizeItems(items), [items]);
  const requiredMappingMissing = REQUIRED_FIELDS.filter((field) => !mapping[field]);
  const canImportMappedRows = parsedRows.length > 0 && requiredMappingMissing.length === 0;
  const canAnalyzeItems = itemSummary.total > 0 && itemSummary.missingTitles === 0 && itemSummary.invalidPrices === 0;

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
  const canAdd = items.length < MAX_IMPORT_ROWS;
  const canRemove = items.length > 1;

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

  const handleFile = async (file?: File) => {
    if (!file) return;
    setIsParsing(true);
    setWarnings([]);
    setHasRun(false);
    try {
      const parsed = await parseInventoryFile(file);
      setFileName(file.name);
      setParsedRows(parsed.rows);
      setColumns(parsed.columns);
      setMapping(inferMapping(parsed.columns));
      if (!parsed.rows.length) setWarnings(['No rows were detected in this file.']);
      if (parsed.rows.length > MAX_IMPORT_ROWS) setWarnings([`This file has ${parsed.rows.length} rows. The MVP imports the first ${MAX_IMPORT_ROWS} rows so the browser stays responsive.`]);
    } catch {
      setWarnings(['Could not parse this file. Try a simple CSV or a single-sheet Excel file.']);
    } finally {
      setIsParsing(false);
    }
  };

  const importMappedRows = () => {
    if (!canImportMappedRows) {
      setWarnings(['Map title and price before importing. Those fields are required for recovery analysis.']);
      return;
    }
    const cleaned = cleanRows(parsedRows, mapping);
    setItems(cleaned.items.length ? cleaned.items : STARTER_ITEMS);
    setWarnings(cleaned.warnings);
    setHasRun(false);
  };

  const runAnalysis = () => {
    if (!canAnalyzeItems) {
      setWarnings(['Fix missing titles and invalid prices before running analysis. Optional fields can stay blank.']);
      setHasRun(false);
      return;
    }
    setHasRun(true);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const steps = [
    { label: 'Upload', complete: Boolean(parsedRows.length || items.length), active: !parsedRows.length },
    { label: 'Map', complete: parsedRows.length > 0 && requiredMappingMissing.length === 0, active: parsedRows.length > 0 && requiredMappingMissing.length > 0 },
    { label: 'Review', complete: canAnalyzeItems, active: !hasRun && canImportMappedRows },
    { label: 'Analyze', complete: hasRun, active: hasRun },
  ];

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Test My Inventory</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Upload real inventory and rank what to fix first.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Drop a CSV or Excel file, map the required columns, review the sanity check, and run recovery analysis without a backend or API.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Current test set</p>
            <p className="mt-2 text-5xl font-black text-[#7AF59A]">{items.length}</p>
            <p className="mt-1 text-sm font-bold text-slate-200">items ready for review</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.label} className={`rounded-2xl border p-4 ${step.complete || step.active ? 'border-[#070A18] bg-[#070A18] text-white' : 'border-tan bg-white text-slate-600'}`}>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-70">Step {index + 1}</p>
            <p className="mt-1 text-lg font-extrabold">{step.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">File Upload</p>
          <h3 className="mt-1 text-2xl font-extrabold text-ink">Upload CSV or Excel</h3>
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-5 flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
              isDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'
            }`}
          >
            <span className="text-lg font-extrabold text-ink">Drop inventory file here</span>
            <span className="mt-2 text-sm font-bold text-slate-600">or click to choose .csv, .xlsx, or .xls</span>
            <input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
          <div className="mt-4 rounded-2xl bg-ivory p-4 text-sm font-bold text-slate-700">
            {isParsing ? 'Parsing file...' : fileName ? `Loaded: ${fileName}` : 'Example columns: title, price, cost, platform, condition, shipping'}
          </div>
        </div>

        <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Column Mapping</p>
              <h3 className="mt-1 text-2xl font-extrabold text-ink">Match file columns to ResaleIQ fields</h3>
            </div>
            <button type="button" onClick={importMappedRows} disabled={!canImportMappedRows} className="bg-[#070A18] text-white hover:bg-[#2B185F] disabled:opacity-40">
              Review Mapped File
            </button>
          </div>

          {columns.length ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {columns.map((column) => (
                  <span key={column} className="rounded-full bg-ivory px-3 py-1 text-xs font-extrabold text-slate-700">{column}</span>
                ))}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {INVENTORY_FIELDS.map((field) => {
                  const missingRequired = Boolean(field.required && !mapping[field.key]);
                  return (
                    <label key={field.key} className={`rounded-2xl p-3 text-sm font-bold ${missingRequired ? 'bg-red-50 text-red-800' : 'bg-ivory text-slate-700'}`}>
                      {field.label}{field.required ? ' required' : ''}
                      <select
                        value={mapping[field.key]}
                        onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}
                      >
                        <option value="">Not mapped</option>
                        {columns.map((column) => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                      {missingRequired ? <span className="mt-2 block text-xs font-extrabold">Map this before importing.</span> : null}
                    </label>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <ScoreCard title="Rows Detected" value={parsedRows.length} helper={`${mappingSummary.importedRows} will import now.`} tone="dark" />
                <ScoreCard title="Missing Titles" value={mappingSummary.titleMissing} helper="Must be fixed before analysis." tone={mappingSummary.titleMissing ? 'danger' : 'success'} />
                <ScoreCard title="Invalid Prices" value={mappingSummary.invalidPrices} helper="Prices must be above $0." tone={mappingSummary.invalidPrices ? 'danger' : 'success'} />
                <ScoreCard title="Skipped Rows" value={mappingSummary.skippedRows} helper={`MVP limit is ${MAX_IMPORT_ROWS} rows.`} tone={mappingSummary.skippedRows ? 'warning' : 'neutral'} />
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-tan bg-ivory p-6 text-sm font-bold leading-6 text-slate-600">
              Upload a file to see detected columns. Title and price are required; optional blanks become warnings.
            </div>
          )}
        </div>
      </div>

      {warnings.length || requiredMappingMissing.length ? (
        <div className="rounded-2xl border border-[#FFD36B]/50 bg-[#FFD36B]/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A5A00]">Warnings, not blockers</p>
          <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
            {requiredMappingMissing.map((field) => <li key={field}>- Map {field} before importing. It is required.</li>)}
            {warnings.map((warning) => <li key={warning}>- {warning}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Review</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Confirm inventory before analysis</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addItem} disabled={!canAdd} className="bg-ivory text-ink disabled:opacity-40">
              Add Item
            </button>
            <button type="button" onClick={runAnalysis} disabled={!canAnalyzeItems} className="bg-[#070A18] text-white hover:bg-[#2B185F] disabled:opacity-40">
              {canAnalyzeItems ? 'Run Full Recovery Analysis' : 'Fix Required Fields First'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ScoreCard title="Total Items" value={itemSummary.total} helper="Rows currently staged for analysis." tone="dark" />
          <ScoreCard title="Missing Titles" value={itemSummary.missingTitles} helper="Required before analysis can run." tone={itemSummary.missingTitles ? 'danger' : 'success'} />
          <ScoreCard title="Invalid Prices" value={itemSummary.invalidPrices} helper="Required price must be above $0." tone={itemSummary.invalidPrices ? 'danger' : 'success'} />
        </div>

        <div className="mt-5 space-y-3">
          {items.map((item, index) => {
            const missingTitle = !item.title.trim();
            const invalidPrice = item.price <= 0;
            return (
              <div key={item.id} className={`grid gap-3 rounded-2xl border p-4 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.9fr_0.7fr_auto] ${missingTitle || invalidPrice ? 'border-red-200 bg-red-50' : 'border-tan/80 bg-ivory'}`}>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Title
                  <input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} placeholder={`Item ${index + 1} title`} />
                  {missingTitle ? <span className="mt-1 block text-xs text-red-700">Required</span> : null}
                </label>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Price
                  <input type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} />
                  {invalidPrice ? <span className="mt-1 block text-xs text-red-700">Must be above $0</span> : null}
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
            );
          })}
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
                      <h4 className="mt-2 text-xl font-extrabold text-ink">{item.title}</h4>
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
          <h3 className="mt-3 text-3xl font-extrabold text-ink">Upload, map, review, then run the recovery analysis.</h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Title and price are required so the money math stays grounded. Optional fields can stay imperfect and will show warnings instead of blocking the flow.
          </p>
        </div>
      )}
    </section>
  );
}
