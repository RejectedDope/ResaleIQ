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
type Confidence = 'High' | 'Medium' | 'Low';
type ColumnMap = Record<InventoryField, string>;
type ConfidenceMap = Record<InventoryField, Confidence>;

type ColumnDetection = {
  column: string;
  confidence: Confidence;
  source: 'header' | 'preview' | 'missing';
};

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

const FIELD_ALIASES: Record<InventoryField, string[]> = {
  title: ['title', 'item', 'item name', 'name', 'product', 'product name', 'listing title', 'description'],
  price: ['price', 'list price', 'sale price', 'listing price', 'current price', 'asking price', 'ask price'],
  cost: ['cost', 'purchase', 'purchase price', 'buy price', 'buy cost', 'purchase cost', 'cogs', 'item cost'],
  platform: ['platform', 'site', 'marketplace', 'channel', 'selling site'],
  condition: ['condition', 'grade', 'item condition'],
  shipping: ['shipping', 'shipping cost', 'shipping paid', 'ship cost', 'postage', 'ship'],
};

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

const EMPTY_CONFIDENCE: ConfidenceMap = {
  title: 'Low',
  price: 'Low',
  cost: 'Low',
  platform: 'Low',
  condition: 'Low',
  shipping: 'Low',
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
  return column.toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function compactColumnName(column: string) {
  return normalizeColumnName(column).replace(/\s/g, '');
}

function isMeaningfulColumn(column: string) {
  const key = compactColumnName(column);
  return Boolean(key && !/^empty\d*$/.test(key) && !/^__empty\d*$/.test(key) && key !== 'blank');
}

function sampleValues(rows: ParsedRow[], column: string) {
  return rows.slice(0, 12).map((row) => row[column]).filter((value) => normalizeText(value));
}

function textScore(rows: ParsedRow[], column: string) {
  const values = sampleValues(rows, column);
  if (!values.length) return 0;
  const textValues = values.filter((value) => {
    const text = normalizeText(value);
    return text.length >= 4 && toNumber(value) === 0 && /[a-z]/i.test(text);
  });
  const avgLength = textValues.reduce((sum, value) => sum + normalizeText(value).length, 0) / Math.max(textValues.length, 1);
  return textValues.length * 2 + avgLength / 12;
}

function moneyScore(rows: ParsedRow[], column: string) {
  const values = sampleValues(rows, column);
  if (!values.length) return 0;
  const numericValues = values.map(toNumber).filter((value) => value > 0 && value < 100000);
  return numericValues.length / values.length;
}

function platformScore(rows: ParsedRow[], column: string) {
  const platforms = ['ebay', 'poshmark', 'mercari', 'depop', 'facebook', 'etsy', 'grailed'];
  const values = sampleValues(rows, column).map((value) => normalizeText(value).toLowerCase());
  if (!values.length) return 0;
  return values.filter((value) => platforms.some((platform) => value.includes(platform))).length / values.length;
}

function conditionScore(rows: ParsedRow[], column: string) {
  const conditions = ['new', 'used', 'preowned', 'pre-owned', 'good', 'fair', 'excellent', 'worn', 'like new'];
  const values = sampleValues(rows, column).map((value) => normalizeText(value).toLowerCase());
  if (!values.length) return 0;
  return values.filter((value) => conditions.some((condition) => value.includes(condition))).length / values.length;
}

function headerDetection(columns: string[], aliases: string[]) {
  const normalizedAliases = aliases.map((alias) => normalizeColumnName(alias));
  const compactAliases = aliases.map((alias) => compactColumnName(alias));
  const normalizedColumns = columns.map((column) => ({
    column,
    normalized: normalizeColumnName(column),
    compact: compactColumnName(column),
  }));

  const exact = normalizedColumns.find(({ normalized, compact }) => normalizedAliases.includes(normalized) || compactAliases.includes(compact));
  if (exact) return { column: exact.column, confidence: 'High' as Confidence };

  const fuzzy = normalizedColumns.find(({ normalized, compact }) => (
    normalizedAliases.some((alias) => normalized.includes(alias) || alias.includes(normalized)) ||
    compactAliases.some((alias) => compact.includes(alias) || alias.includes(compact))
  ));

  if (fuzzy) return { column: fuzzy.column, confidence: 'Medium' as Confidence };
  return null;
}

function previewDetection(field: InventoryField, columns: string[], rows: ParsedRow[], usedColumns: Set<string>): ColumnDetection {
  const availableColumns = columns.filter((column) => !usedColumns.has(column));
  const ranked = availableColumns
    .map((column) => {
      if (field === 'title') return { column, score: textScore(rows, column) };
      if (field === 'platform') return { column, score: platformScore(rows, column) };
      if (field === 'condition') return { column, score: conditionScore(rows, column) };
      return { column, score: moneyScore(rows, column) };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return { column: '', confidence: 'Low', source: 'missing' };
  const threshold = field === 'title' ? 4 : field === 'platform' || field === 'condition' ? 0.35 : 0.5;
  if (best.score >= threshold) return { column: best.column, confidence: 'Medium', source: 'preview' };
  return { column: '', confidence: 'Low', source: 'missing' };
}

function detectField(field: InventoryField, columns: string[], rows: ParsedRow[], usedColumns: Set<string>): ColumnDetection {
  const header = headerDetection(columns.filter((column) => !usedColumns.has(column)), FIELD_ALIASES[field]);
  if (header) return { ...header, source: 'header' };
  return previewDetection(field, columns, rows, usedColumns);
}

function inferMapping(columns: string[], rows: ParsedRow[]) {
  const usedColumns = new Set<string>();
  const detections = INVENTORY_FIELDS.reduce((current, field) => {
    const detection = detectField(field.key, columns, rows, usedColumns);
    if (detection.column) usedColumns.add(detection.column);
    return { ...current, [field.key]: detection };
  }, {} as Record<InventoryField, ColumnDetection>);

  return {
    mapping: INVENTORY_FIELDS.reduce((current, field) => ({ ...current, [field.key]: detections[field.key].column }), EMPTY_MAPPING),
    confidence: INVENTORY_FIELDS.reduce((current, field) => ({ ...current, [field.key]: detections[field.key].confidence }), EMPTY_CONFIDENCE),
    detections,
  };
}

function summarizeRows(rows: ParsedRow[], mapping: ColumnMap) {
  const limitedRows = rows.slice(0, MAX_IMPORT_ROWS);
  const missingTitles = !mapping.title ? limitedRows.length : limitedRows.filter((row) => !normalizeText(row[mapping.title])).length;
  const priceProblems = !mapping.price ? limitedRows.length : limitedRows.filter((row) => toNumber(row[mapping.price]) <= 0).length;

  return {
    importedRows: limitedRows.length,
    skippedRows: Math.max(0, rows.length - MAX_IMPORT_ROWS),
    missingTitles,
    priceProblems,
    ready: Boolean(mapping.title && mapping.price && missingTitles === 0 && priceProblems === 0 && limitedRows.length > 0),
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

    return { id: index + 1, title, price, cost, platform, condition, shipping };
  });

  if (rows.length > MAX_IMPORT_ROWS) warnings.push(`This file has more than ${MAX_IMPORT_ROWS} rows, so the MVP imported the first ${MAX_IMPORT_ROWS}.`);

  return { items, warnings: Array.from(new Set(warnings)) };
}

function summarizeItems(items: InventoryDraft[]) {
  return {
    total: items.length,
    missingTitles: items.filter((item) => !item.title.trim()).length,
    priceProblems: items.filter((item) => item.price <= 0).length,
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
  const columns = Object.keys(rows[0] ?? {}).filter(isMeaningfulColumn);

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
  const [confidence, setConfidence] = useState<ConfidenceMap>(EMPTY_CONFIDENCE);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const mappingSummary = useMemo(() => summarizeRows(parsedRows, mapping), [parsedRows, mapping]);
  const itemSummary = useMemo(() => summarizeItems(items), [items]);
  const requiredMappingMissing = REQUIRED_FIELDS.filter((field) => !mapping[field]);
  const canConfirmDetectedRows = parsedRows.length > 0 && requiredMappingMissing.length === 0;
  const canRunDetectedAnalysis = mappingSummary.ready;
  const canAnalyzeItems = itemSummary.total > 0 && itemSummary.missingTitles === 0 && itemSummary.priceProblems === 0;
  const previewRows = parsedRows.slice(0, 5);
  const previewColumns = INVENTORY_FIELDS.map((field) => mapping[field.key]).filter(Boolean);

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
    setShowFieldEditor(false);
    try {
      const parsed = await parseInventoryFile(file);
      const detection = inferMapping(parsed.columns, parsed.rows);
      const nextWarnings: string[] = [];

      if (!parsed.rows.length) nextWarnings.push('We could not find any inventory rows in this file.');
      if (parsed.rows.length && !detection.mapping.title) nextWarnings.push('We still need your title column. Open Adjust Fields if the preview shows it under a different name.');
      if (parsed.rows.length && !detection.mapping.price) nextWarnings.push('We still need your price column. Open Adjust Fields if the preview shows it under a different name.');
      if (parsed.rows.length > MAX_IMPORT_ROWS) nextWarnings.push(`This file has ${parsed.rows.length} rows. The MVP will use the first ${MAX_IMPORT_ROWS}.`);

      setFileName(file.name);
      setParsedRows(parsed.rows);
      setColumns(parsed.columns);
      setMapping(detection.mapping);
      setConfidence(detection.confidence);
      setWarnings(nextWarnings);
    } catch {
      setWarnings(['We could not read this file. Try a simple CSV or a single-sheet Excel file.']);
    } finally {
      setIsParsing(false);
    }
  };

  const runDetectedAnalysis = () => {
    if (!canRunDetectedAnalysis) {
      setWarnings(['We need item titles and prices above $0 before recovery analysis can run.']);
      setShowFieldEditor(true);
      setHasRun(false);
      return;
    }
    const cleaned = cleanRows(parsedRows, mapping);
    setItems(cleaned.items.length ? cleaned.items : STARTER_ITEMS);
    setWarnings(cleaned.warnings);
    setHasRun(true);
  };

  const runAnalysis = () => {
    if (!canAnalyzeItems) {
      setWarnings(['Some rows still need a title or a usable price before analysis can run.']);
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
    { label: 'Confirm', complete: canConfirmDetectedRows, active: parsedRows.length > 0 && !hasRun },
    { label: 'Ready', complete: canAnalyzeItems, active: !hasRun && canAnalyzeItems },
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
              Drop a CSV or Excel file, confirm that ResaleIQ found the right fields, then run recovery analysis without a backend or API.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Current test set</p>
            <p className="mt-2 text-5xl font-black text-[#7AF59A]">{items.length}</p>
            <p className="mt-1 text-sm font-bold text-slate-200">items ready to analyze</p>
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

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
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
            {isParsing ? 'Reading your file...' : fileName ? `Loaded: ${fileName}` : 'Example columns: item name, listing price, buy price, marketplace, condition, shipping'}
          </div>
        </div>

        <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Confirm Your Inventory Data</p>
              <h3 className="mt-1 text-2xl font-extrabold text-ink">{canRunDetectedAnalysis ? 'This looks good - you are ready to analyze' : 'Upload inventory to begin'}</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowFieldEditor((value) => !value)} disabled={!columns.length} className="bg-ivory text-ink disabled:opacity-40">
                Adjust Fields
              </button>
              <button type="button" onClick={runDetectedAnalysis} disabled={!canRunDetectedAnalysis} className="bg-[#070A18] px-6 py-4 text-base font-extrabold text-white hover:bg-[#2B185F] disabled:opacity-40">
                Run Recovery Analysis
              </button>
            </div>
          </div>

          {columns.length ? (
            <>
              {canRunDetectedAnalysis ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Inventory detected</p>
                  <h4 className="mt-2 text-2xl font-extrabold">We've successfully read your inventory.</h4>
                  <p className="mt-2 text-sm font-bold text-emerald-800">This looks good - you're ready to analyze.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 text-sm font-extrabold text-emerald-900">✓ Inventory detected</div>
                    <div className="rounded-2xl bg-white p-4 text-sm font-extrabold text-emerald-900">✓ Prices found</div>
                    <div className="rounded-2xl bg-white p-4 text-sm font-extrabold text-emerald-900">✓ Titles found</div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {INVENTORY_FIELDS.map((field) => {
                  const detected = mapping[field.key];
                  const requiredMissing = Boolean(field.required && !detected);
                  const needsAttention = Boolean(detected && confidence[field.key] !== 'High');
                  const cardClass = requiredMissing
                    ? 'border border-red-200 bg-red-50 text-red-800'
                    : needsAttention
                      ? 'border border-[#FFD36B]/60 bg-[#FFD36B]/10 text-[#6F4A00]'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-950';
                  const detectedMessage = detected
                    ? `Ready: ${detected}`
                    : field.required
                      ? `We still need your ${field.label.toLowerCase()} column`
                      : 'Optional field not detected';

                  return (
                    <div key={field.key} className={`rounded-2xl p-4 ${cardClass}`}>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-70">{field.label}</p>
                      <p className="mt-2 text-sm font-extrabold">{detectedMessage}</p>
                      <p className="mt-2 text-xs font-bold">Confidence: {detected ? confidence[field.key] : 'Low'}{needsAttention ? ' - matched from preview' : ''}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-tan bg-ivory p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Preview</p>
                    <h4 className="mt-1 text-xl font-extrabold text-ink">First 5 rows</h4>
                  </div>
                  <p className="text-sm font-bold text-slate-600">{mappingSummary.importedRows} rows ready, {mappingSummary.skippedRows} over the MVP limit</p>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                      <tr className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                        {previewColumns.map((column) => <th key={column} className="px-3 py-2">{column}</th>)}
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-slate-700">
                      {previewRows.map((row, index) => (
                        <tr key={index} className="border-t border-tan/70">
                          {previewColumns.map((column) => <td key={column} className="max-w-[220px] truncate px-3 py-3">{normalizeText(row[column]) || '-'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {showFieldEditor ? (
                <div className="mt-5 rounded-2xl border border-[#29204E] bg-[#070A18] p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Adjust only if needed</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {INVENTORY_FIELDS.map((field) => (
                      <label key={field.key} className="text-sm font-bold text-slate-200">
                        {field.label}{field.required ? ' required' : ''}
                        <select
                          value={mapping[field.key]}
                          onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}
                        >
                          <option value="">Leave blank</option>
                          {columns.map((column) => (
                            <option key={column} value={column}>{column}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-tan bg-ivory p-6 text-sm font-bold leading-6 text-slate-600">
              Upload a file and ResaleIQ will detect the useful columns automatically. You only adjust fields if a required column is missing.
            </div>
          )}
        </div>
      </div>

      {warnings.length || requiredMappingMissing.length || mappingSummary.priceProblems || mappingSummary.missingTitles ? (
        <div className={`rounded-2xl border p-5 ${requiredMappingMissing.length ? 'border-red-200 bg-red-50' : 'border-[#FFD36B]/50 bg-[#FFD36B]/10'}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${requiredMappingMissing.length ? 'text-red-800' : 'text-[#8A5A00]'}`}>{requiredMappingMissing.length ? 'Missing required data' : 'Ready with notes'}</p>
          <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
            {mappingSummary.missingTitles && mapping.title ? <li>- Some rows are missing item titles.</li> : null}
            {mappingSummary.priceProblems && mapping.price ? <li>- Some rows need a usable price above $0.</li> : null}
            {warnings.map((warning) => <li key={warning}>- {warning}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Ready Inventory</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Inventory staged for recovery analysis</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addItem} disabled={!canAdd} className="bg-ivory text-ink disabled:opacity-40">
              Add Item
            </button>
            <button type="button" onClick={runAnalysis} disabled={!canAnalyzeItems} className="bg-[#070A18] text-white hover:bg-[#2B185F] disabled:opacity-40">
              {canAnalyzeItems ? 'Run Recovery Analysis' : 'Fix Required Fields First'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ScoreCard title="Total Items" value={itemSummary.total} helper="Rows currently staged for analysis." tone="dark" />
          <ScoreCard title="Rows Missing Title" value={itemSummary.missingTitles} helper="Needed before analysis can run." tone={itemSummary.missingTitles ? 'danger' : 'success'} />
          <ScoreCard title="Rows Needing Price" value={itemSummary.priceProblems} helper="Price must be above $0." tone={itemSummary.priceProblems ? 'danger' : 'success'} />
        </div>

        <div className="mt-5 space-y-3">
          {items.map((item, index) => {
            const missingTitle = !item.title.trim();
            const priceProblem = item.price <= 0;
            return (
              <div key={item.id} className={`grid gap-3 rounded-2xl border p-4 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.9fr_0.7fr_auto] ${missingTitle || priceProblem ? 'border-red-200 bg-red-50' : 'border-tan/80 bg-ivory'}`}>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Title
                  <input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} placeholder={`Item ${index + 1} title`} />
                  {missingTitle ? <span className="mt-1 block text-xs text-red-700">Needed</span> : null}
                </label>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Price
                  <input type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} />
                  {priceProblem ? <span className="mt-1 block text-xs text-red-700">Needs price above $0</span> : null}
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
          <h3 className="mt-3 text-3xl font-extrabold text-ink">Upload, confirm, then run the recovery analysis.</h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            ResaleIQ detects likely columns first. Once titles and prices are found, the next step is recovery analysis.
          </p>
        </div>
      )}
    </section>
  );
}
