'use client';

import { type DragEvent, useEffect, useMemo, useState } from 'react';
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
type ItemStatus = 'pending' | 'completed';
type ItemStatusMap = Record<string, ItemStatus>;

type WeeklySummary = {
  itemsFixed: number;
  estimatedProfitImpact: number;
};

type SnapshotItem = InventoryDraft & {
  roi: number;
  risk: number;
  status: 'active' | ItemStatus;
};

type InventorySnapshot = {
  savedAt: string;
  items: SnapshotItem[];
};

type ChangeSummary = {
  improved: number;
  stillAtRisk: number;
  worse: number;
  priceChanges: number;
};

type RowAnalysis = {
  item: InventoryDraft;
  input: ListingInput;
  analysis: ReturnType<typeof analyzeListing>;
  current: { price: number; profit: number; roi: number };
  fixed: { price: number; profit: number; roi: number; improvement: number };
  band: { low: number; high: number };
};

const MAX_IMPORT_ROWS = 100;
const ITEM_STATUS_SESSION_KEY = 'resaleiq-inventory-item-statuses';
const WEEKLY_SUMMARY_KEY = 'resaleiq-weekly-summary';
const INVENTORY_SNAPSHOT_KEY = 'resaleiq-inventory-snapshot';

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

const FIELD_LABELS: { key: InventoryField; label: string; required?: boolean }[] = [
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

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? '').replace(/[$,]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeColumnName(column: string) {
  return column.toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function compactColumnName(column: string) {
  return normalizeColumnName(column).replace(/\s/g, '');
}

function itemKey(title: string) {
  return normalizeColumnName(title).slice(0, 80);
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
  const textValues = values.filter((value) => normalizeText(value).length >= 4 && toNumber(value) === 0 && /[a-z]/i.test(normalizeText(value)));
  return textValues.length * 2 + textValues.reduce((sum, value) => sum + normalizeText(value).length, 0) / Math.max(textValues.length, 1) / 12;
}

function moneyScore(rows: ParsedRow[], column: string) {
  const values = sampleValues(rows, column);
  if (!values.length) return 0;
  return values.map(toNumber).filter((value) => value > 0 && value < 100000).length / values.length;
}

function wordScore(rows: ParsedRow[], column: string, words: string[]) {
  const values = sampleValues(rows, column).map((value) => normalizeText(value).toLowerCase());
  if (!values.length) return 0;
  return values.filter((value) => words.some((word) => value.includes(word))).length / values.length;
}

function detectHeader(columns: string[], field: InventoryField) {
  const aliases = FIELD_ALIASES[field];
  const normalizedAliases = aliases.map(normalizeColumnName);
  const compactAliases = aliases.map(compactColumnName);
  const normalizedColumns = columns.map((column) => ({ column, normalized: normalizeColumnName(column), compact: compactColumnName(column) }));
  const exact = normalizedColumns.find(({ normalized, compact }) => normalizedAliases.includes(normalized) || compactAliases.includes(compact));
  if (exact) return exact.column;
  const fuzzy = normalizedColumns.find(({ normalized, compact }) => normalizedAliases.some((alias) => normalized.includes(alias)) || compactAliases.some((alias) => compact.includes(alias)));
  return fuzzy?.column || '';
}

function detectByPreview(field: InventoryField, columns: string[], rows: ParsedRow[], used: Set<string>) {
  const ranked = columns
    .filter((column) => !used.has(column))
    .map((column) => {
      if (field === 'title') return { column, score: textScore(rows, column) };
      if (field === 'platform') return { column, score: wordScore(rows, column, ['ebay', 'poshmark', 'mercari', 'depop', 'facebook', 'etsy', 'grailed']) };
      if (field === 'condition') return { column, score: wordScore(rows, column, ['new', 'used', 'preowned', 'pre-owned', 'good', 'fair', 'excellent', 'worn', 'like new']) };
      return { column, score: moneyScore(rows, column) };
    })
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const threshold = field === 'title' ? 4 : field === 'platform' || field === 'condition' ? 0.35 : 0.5;
  return best && best.score >= threshold ? best.column : '';
}

function inferMapping(columns: string[], rows: ParsedRow[]) {
  const used = new Set<string>();
  return FIELD_LABELS.reduce((mapping, field) => {
    const header = detectHeader(columns.filter((column) => !used.has(column)), field.key);
    const detected = header || detectByPreview(field.key, columns, rows, used);
    if (detected) used.add(detected);
    return { ...mapping, [field.key]: detected };
  }, EMPTY_MAPPING);
}

function cleanRows(rows: ParsedRow[], mapping: ColumnMap) {
  return rows.slice(0, MAX_IMPORT_ROWS).map((row, index) => ({
    id: index + 1,
    title: normalizeText(row[mapping.title]),
    price: toNumber(row[mapping.price]),
    cost: toNumber(row[mapping.cost]),
    platform: normalizeText(row[mapping.platform]) || 'eBay',
    condition: normalizeText(row[mapping.condition]).toLowerCase() || 'condition missing',
    shipping: toNumber(row[mapping.shipping]),
  }));
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
  const price = input.targetSalePrice * (1 - Math.min(0.3, riskScore * 0.003));
  const profit = baseProfit(input, price);
  return { price, profit, roi: Math.round((profit / Math.max(input.purchaseCost, 1)) * 100) };
}

function fixedOutcome(input: ListingInput, action: string, riskScore: number) {
  const current = currentOutcome(input, riskScore);
  const liftByAction: Record<string, number> = { Relist: 0.08, Reprice: 0.06, Crosslist: 0.1, Bundle: 0.12, Hold: 0.03, 'Donate/Liquidate': 0.04 };
  const price = Math.min(input.targetSalePrice * 1.12, current.price + input.targetSalePrice * (liftByAction[action] ?? 0.06));
  const profit = baseProfit(input, price);
  return { price, profit, roi: Math.round((profit / Math.max(input.purchaseCost, 1)) * 100), improvement: Math.max(0, profit - current.profit) };
}

function pricingBand(input: ListingInput, riskScore: number) {
  return {
    low: Math.max(6, input.targetSalePrice * (riskScore > 60 ? 0.72 : 0.82)),
    high: input.targetSalePrice * (riskScore > 60 ? 0.96 : 1.08),
  };
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
  return [input.brand, input.title, input.condition].filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 80);
}

async function parseInventoryFile(file: File) {
  const XLSX = await import('xlsx');
  const extension = file.name.split('.').pop()?.toLowerCase();
  const workbook = extension === 'csv' ? XLSX.read(await file.text(), { type: 'string' }) : XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ParsedRow>(firstSheet, { defval: '' });
  return { rows, columns: Object.keys(rows[0] ?? {}).filter(isMeaningfulColumn) };
}

function makeSnapshot(rows: RowAnalysis[], statuses: ItemStatusMap): InventorySnapshot {
  return {
    savedAt: new Date().toISOString(),
    items: rows.map(({ item, current, analysis }) => ({
      ...item,
      roi: current.roi,
      risk: analysis.deadListingRisk.riskScore,
      status: statuses[String(item.id)] || 'active',
    })),
  };
}

function compareSnapshots(current: InventorySnapshot, previous?: InventorySnapshot | null): ChangeSummary | null {
  if (!previous?.items.length) return null;
  const previousByTitle = new Map(previous.items.map((item) => [itemKey(item.title), item]));
  return current.items.reduce(
    (summary, item) => {
      const previousItem = previousByTitle.get(itemKey(item.title));
      if (!previousItem) return summary;
      const priceChanged = Math.abs(item.price - previousItem.price) >= 1;
      const improved = item.roi > previousItem.roi || item.risk < previousItem.risk;
      const worse = item.roi < previousItem.roi || item.risk > previousItem.risk;
      return {
        improved: summary.improved + (improved ? 1 : 0),
        stillAtRisk: summary.stillAtRisk + (item.risk >= 30 && item.status !== 'completed' ? 1 : 0),
        worse: summary.worse + (worse && !improved ? 1 : 0),
        priceChanges: summary.priceChanges + (priceChanged ? 1 : 0),
      };
    },
    { improved: 0, stillAtRisk: 0, worse: 0, priceChanges: 0 },
  );
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
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [itemStatuses, setItemStatuses] = useState<ItemStatusMap>({});
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({ itemsFixed: 0, estimatedProfitImpact: 0 });
  const [savedSnapshot, setSavedSnapshot] = useState<InventorySnapshot | null>(null);
  const [changeSummary, setChangeSummary] = useState<ChangeSummary | null>(null);
  const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null);
  const [completionMessage, setCompletionMessage] = useState('');

  useEffect(() => {
    try {
      const statuses = window.localStorage.getItem(ITEM_STATUS_SESSION_KEY);
      const summary = window.localStorage.getItem(WEEKLY_SUMMARY_KEY);
      const snapshot = window.localStorage.getItem(INVENTORY_SNAPSHOT_KEY);
      if (statuses) setItemStatuses(JSON.parse(statuses));
      if (summary) setWeeklySummary(JSON.parse(summary));
      if (snapshot) setSavedSnapshot(JSON.parse(snapshot));
    } catch {
      window.localStorage.removeItem(ITEM_STATUS_SESSION_KEY);
      window.localStorage.removeItem(WEEKLY_SUMMARY_KEY);
      window.localStorage.removeItem(INVENTORY_SNAPSHOT_KEY);
    }
  }, []);

  const rows = useMemo<RowAnalysis[]>(() => items.map((item, index) => {
    const input = toListingInput(item, index);
    const analysis = analyzeListing(input);
    const current = currentOutcome(input, analysis.deadListingRisk.riskScore);
    const fixed = fixedOutcome(input, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore);
    const band = pricingBand(input, analysis.deadListingRisk.riskScore);
    return { item, input, analysis, current, fixed, band };
  }), [items]);

  useEffect(() => {
    window.localStorage.setItem(ITEM_STATUS_SESSION_KEY, JSON.stringify(itemStatuses));
    window.localStorage.setItem(WEEKLY_SUMMARY_KEY, JSON.stringify(weeklySummary));
  }, [itemStatuses, weeklySummary]);

  useEffect(() => {
    if (!hasRun || !rows.length) return;
    const snapshot = makeSnapshot(rows, itemStatuses);
    window.localStorage.setItem(INVENTORY_SNAPSHOT_KEY, JSON.stringify(snapshot));
    setSavedSnapshot(snapshot);
  }, [hasRun, itemStatuses, rows]);

  const importedRows = parsedRows.slice(0, MAX_IMPORT_ROWS);
  const requiredMissing = (['title', 'price'] as InventoryField[]).filter((field) => !mapping[field]);
  const missingTitles = mapping.title ? importedRows.filter((row) => !normalizeText(row[mapping.title])).length : importedRows.length;
  const priceProblems = mapping.price ? importedRows.filter((row) => toNumber(row[mapping.price]) <= 0).length : importedRows.length;
  const canRunDetectedAnalysis = importedRows.length > 0 && requiredMissing.length === 0 && missingTitles === 0 && priceProblems === 0;
  const itemSummary = {
    total: items.length,
    missingTitles: items.filter((item) => !item.title.trim()).length,
    priceProblems: items.filter((item) => item.price <= 0).length,
  };
  const canAnalyzeItems = itemSummary.total > 0 && itemSummary.missingTitles === 0 && itemSummary.priceProblems === 0;
  const previewColumns = FIELD_LABELS.map((field) => mapping[field.key]).filter(Boolean);

  const prioritized = [...rows].sort((a, b) => b.fixed.improvement - a.fixed.improvement || b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore);
  const completedRows = prioritized.filter((row) => itemStatuses[String(row.item.id)] === 'completed');
  const pendingRows = prioritized.filter((row) => itemStatuses[String(row.item.id)] === 'pending');
  const activeRows = prioritized.filter((row) => !itemStatuses[String(row.item.id)]);
  const topItems = activeRows.slice(0, 5);
  const totalRecoverable = prioritized.reduce((sum, row) => sum + row.fixed.improvement, 0);
  const potentialRecovered = completedRows.reduce((sum, row) => sum + row.fixed.improvement, 0);
  const pendingPotential = pendingRows.reduce((sum, row) => sum + row.fixed.improvement, 0);
  const remainingRecoverable = [...activeRows, ...pendingRows].reduce((sum, row) => sum + row.fixed.improvement, 0);
  const averageRoi = Math.round(prioritized.reduce((sum, row) => sum + row.current.roi, 0) / Math.max(prioritized.length, 1));

  const clearRunState = () => {
    setItemStatuses({});
    setConfirmingItemId(null);
    setCompletionMessage('');
    setChangeSummary(null);
  };

  const runWithItems = (nextItems: InventoryDraft[], nextStatuses: ItemStatusMap = {}) => {
    setItems(nextItems);
    setItemStatuses(nextStatuses);
    setHasRun(true);
    setCompletionMessage('Inventory snapshot saved. You can track this batch over time.');
  };

  const runAnalysis = () => {
    if (!canAnalyzeItems) {
      setWarnings(['Some rows still need a title or a usable price before analysis can run.']);
      return;
    }
    const snapshot = makeSnapshot(rows, itemStatuses);
    setChangeSummary(compareSnapshots(snapshot, savedSnapshot));
    setHasRun(true);
    setCompletionMessage('Inventory snapshot saved. You can track this batch over time.');
  };

  const runDetectedAnalysis = () => {
    if (!canRunDetectedAnalysis) {
      setWarnings(['We need item titles and prices above $0 before recovery analysis can run.']);
      setShowFieldEditor(true);
      return;
    }
    const cleaned = cleanRows(parsedRows, mapping);
    const nextRows = cleaned.map((item, index) => {
      const input = toListingInput(item, index);
      const analysis = analyzeListing(input);
      return { ...item, roi: currentOutcome(input, analysis.deadListingRisk.riskScore).roi, risk: analysis.deadListingRisk.riskScore, status: 'active' as const };
    });
    const comparison = compareSnapshots({ savedAt: new Date().toISOString(), items: nextRows }, savedSnapshot);
    setItems(cleaned.length ? cleaned : STARTER_ITEMS);
    setItemStatuses({});
    setChangeSummary(comparison);
    setWarnings(parsedRows.length > MAX_IMPORT_ROWS ? [`This file has more than ${MAX_IMPORT_ROWS} rows, so the MVP imported the first ${MAX_IMPORT_ROWS}.`] : []);
    setHasRun(true);
    setCompletionMessage('Inventory snapshot saved. You can track this batch over time.');
  };

  const continuePreviousSession = () => {
    if (!savedSnapshot) return;
    const nextStatuses = savedSnapshot.items.reduce<ItemStatusMap>((current, item) => (item.status === 'active' ? current : { ...current, [String(item.id)]: item.status }), {});
    runWithItems(savedSnapshot.items.map(({ roi, risk, status, ...item }) => item), nextStatuses);
  };

  const startFresh = () => {
    window.localStorage.removeItem(INVENTORY_SNAPSHOT_KEY);
    window.localStorage.removeItem(ITEM_STATUS_SESSION_KEY);
    setSavedSnapshot(null);
    setItems(STARTER_ITEMS);
    setHasRun(false);
    clearRunState();
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setIsParsing(true);
    setWarnings([]);
    setHasRun(false);
    setShowFieldEditor(false);
    clearRunState();
    try {
      const parsed = await parseInventoryFile(file);
      const detected = inferMapping(parsed.columns, parsed.rows);
      const nextWarnings: string[] = [];
      if (!parsed.rows.length) nextWarnings.push('We could not find any inventory rows in this file.');
      if (parsed.rows.length && !detected.title) nextWarnings.push('We still need your title column. Open Adjust Fields if the preview shows it under a different name.');
      if (parsed.rows.length && !detected.price) nextWarnings.push('We still need your price column. Open Adjust Fields if the preview shows it under a different name.');
      setFileName(file.name);
      setParsedRows(parsed.rows);
      setColumns(parsed.columns);
      setMapping(detected);
      setWarnings(nextWarnings);
    } catch {
      setWarnings(['We could not read this file. Try a simple CSV or a single-sheet Excel file.']);
    } finally {
      setIsParsing(false);
    }
  };

  const updateItem = (id: number, key: keyof InventoryDraft, value: string | number) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    setHasRun(false);
    clearRunState();
  };

  const addItem = () => {
    if (items.length >= MAX_IMPORT_ROWS) return;
    setItems((current) => [...current, { id: Math.max(...current.map((item) => item.id)) + 1, title: '', price: 0, cost: 0, platform: 'eBay', condition: '', shipping: 0 }]);
    setHasRun(false);
    clearRunState();
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems((current) => current.filter((item) => item.id !== id));
    setHasRun(false);
    clearRunState();
  };

  const completeAppliedFix = (id: number, improvement: number) => {
    const wasCompleted = itemStatuses[String(id)] === 'completed';
    setItemStatuses((current) => ({ ...current, [String(id)]: 'completed' }));
    if (!wasCompleted) {
      setWeeklySummary((current) => ({ itemsFixed: current.itemsFixed + 1, estimatedProfitImpact: current.estimatedProfitImpact + improvement }));
    }
    setConfirmingItemId(null);
    setCompletionMessage(`Nice - $${improvement.toFixed(0)} potential recovered based on the fix you applied.`);
  };

  const moveToPending = (id: number) => {
    setItemStatuses((current) => ({ ...current, [String(id)]: 'pending' }));
    setConfirmingItemId(null);
    setCompletionMessage('Saved to Pending Fixes. It will stay out of your active list until you apply it.');
  };

  const movePendingToActive = (id: number) => {
    setItemStatuses((current) => {
      const next = { ...current };
      delete next[String(id)];
      return next;
    });
    setCompletionMessage('Moved back to Active Fixes.');
  };

  const recheckItem = (row: RowAnalysis) => {
    const previous = savedSnapshot?.items.find((item) => itemKey(item.title) === itemKey(row.item.title));
    const direction = previous
      ? row.current.roi > previous.roi || row.analysis.deadListingRisk.riskScore < previous.risk
        ? 'Improved since the last snapshot.'
        : row.current.roi < previous.roi || row.analysis.deadListingRisk.riskScore > previous.risk
          ? 'Needs attention: ROI or risk moved the wrong way.'
          : 'No major change since the last snapshot.'
      : 'No previous snapshot for this item yet.';
    setCompletionMessage(`Re-check complete: ROI ${row.current.roi}%, risk ${row.analysis.deadListingRisk.riskScore}. ${direction}`);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Test My Inventory</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">Upload real inventory and improve it over time.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">ResaleIQ saves a local snapshot after analysis so every rerun can show what improved, what is still at risk, and what got worse.</p>
          </div>
          <div className="rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Current test set</p>
            <p className="mt-2 text-5xl font-black text-[#7AF59A]">{items.length}</p>
            <p className="mt-1 text-sm font-bold text-slate-200">items ready to analyze</p>
          </div>
        </div>
      </div>

      {savedSnapshot && !hasRun ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Resume your last inventory</p>
          <h3 className="mt-2 text-2xl font-extrabold">{savedSnapshot.items.length} saved items from {new Date(savedSnapshot.savedAt).toLocaleDateString()}</h3>
          <p className="mt-2 text-sm font-bold text-emerald-800">Continue the previous checklist or start fresh with a new batch.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={continuePreviousSession} className="bg-[#070A18] text-white">Continue Session</button>
            <button type="button" onClick={startFresh} className="bg-white text-ink">Start Fresh</button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">File Upload</p>
          <h3 className="mt-1 text-2xl font-extrabold text-ink">Upload CSV or Excel</h3>
          <label
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mt-5 flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${isDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'}`}
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
              <button type="button" onClick={() => setShowFieldEditor((value) => !value)} disabled={!columns.length} className="bg-ivory text-ink disabled:opacity-40">Adjust Fields</button>
              <button type="button" onClick={runDetectedAnalysis} disabled={!canRunDetectedAnalysis} className="bg-[#070A18] px-6 py-4 text-base font-extrabold text-white hover:bg-[#2B185F] disabled:opacity-40">Run Recovery Analysis</button>
            </div>
          </div>

          {columns.length ? (
            <>
              {canRunDetectedAnalysis ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Inventory detected</p>
                  <h4 className="mt-2 text-2xl font-extrabold">We've successfully read your inventory.</h4>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 text-sm font-extrabold text-emerald-900">✓ Inventory detected</div>
                    <div className="rounded-2xl bg-white p-4 text-sm font-extrabold text-emerald-900">✓ Prices found</div>
                    <div className="rounded-2xl bg-white p-4 text-sm font-extrabold text-emerald-900">✓ Titles found</div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {FIELD_LABELS.map((field) => {
                  const detected = mapping[field.key];
                  const requiredMissing = Boolean(field.required && !detected);
                  return (
                    <div key={field.key} className={`rounded-2xl border p-4 ${requiredMissing ? 'border-red-200 bg-red-50 text-red-800' : detected ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-[#FFD36B]/60 bg-[#FFD36B]/10 text-[#6F4A00]'}`}>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-70">{field.label}</p>
                      <p className="mt-2 text-sm font-extrabold">{detected ? `Ready: ${detected}` : field.required ? `We still need your ${field.label.toLowerCase()} column` : 'Optional field not detected'}</p>
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
                  <p className="text-sm font-bold text-slate-600">{importedRows.length} rows ready, {Math.max(0, parsedRows.length - MAX_IMPORT_ROWS)} over the MVP limit</p>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                      <tr className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                        {previewColumns.map((column) => <th key={column} className="px-3 py-2">{column}</th>)}
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-slate-700">
                      {importedRows.slice(0, 5).map((row, index) => (
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
                    {FIELD_LABELS.map((field) => (
                      <label key={field.key} className="text-sm font-bold text-slate-200">
                        {field.label}{field.required ? ' required' : ''}
                        <select value={mapping[field.key]} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}>
                          <option value="">Leave blank</option>
                          {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-tan bg-ivory p-6 text-sm font-bold leading-6 text-slate-600">Upload a file and ResaleIQ will detect the useful columns automatically.</div>
          )}
        </div>
      </div>

      {warnings.length ? (
        <div className="rounded-2xl border border-[#FFD36B]/50 bg-[#FFD36B]/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A5A00]">Ready with notes</p>
          <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">{warnings.map((warning) => <li key={warning}>- {warning}</li>)}</ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Ready Inventory</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Inventory staged for recovery analysis</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addItem} disabled={items.length >= MAX_IMPORT_ROWS} className="bg-ivory text-ink disabled:opacity-40">Add Item</button>
            <button type="button" onClick={runAnalysis} disabled={!canAnalyzeItems} className="bg-[#070A18] text-white hover:bg-[#2B185F] disabled:opacity-40">Run Recovery Analysis</button>
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
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Title<input value={item.title} onChange={(e) => updateItem(item.id, 'title', e.target.value)} placeholder={`Item ${index + 1} title`} />{missingTitle ? <span className="mt-1 block text-xs text-red-700">Needed</span> : null}</label>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Price<input type="number" min={0} step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} />{priceProblem ? <span className="mt-1 block text-xs text-red-700">Needs price above $0</span> : null}</label>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Cost<input type="number" min={0} step="0.01" value={item.cost} onChange={(e) => updateItem(item.id, 'cost', Number(e.target.value))} /></label>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Platform<input value={item.platform} onChange={(e) => updateItem(item.id, 'platform', e.target.value)} /></label>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Condition<input value={item.condition} onChange={(e) => updateItem(item.id, 'condition', e.target.value)} /></label>
                <label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Shipping<input type="number" min={0} step="0.01" value={item.shipping} onChange={(e) => updateItem(item.id, 'shipping', Number(e.target.value))} /></label>
                <button type="button" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="self-end bg-white text-red-700 disabled:opacity-30">Remove</button>
              </div>
            );
          })}
        </div>
      </div>

      {hasRun ? (
        <>
          {completionMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Progress saved</p><h3 className="mt-2 text-2xl font-extrabold">{completionMessage}</h3></div> : null}

          {changeSummary ? (
            <div className="grid gap-4 md:grid-cols-4">
              <ScoreCard title="Items Improved" value={changeSummary.improved} helper="ROI improved or risk dropped since the last snapshot." tone="success" />
              <ScoreCard title="Still At Risk" value={changeSummary.stillAtRisk} helper="Items still above the action threshold." tone={changeSummary.stillAtRisk ? 'warning' : 'success'} />
              <ScoreCard title="Got Worse" value={changeSummary.worse} helper="ROI dropped or risk increased." tone={changeSummary.worse ? 'danger' : 'success'} />
              <ScoreCard title="Price Changes" value={changeSummary.priceChanges} helper="Items with a changed current price." tone="dark" />
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7AF59A]">Recovery Session</p>
                <h3 className="mt-2 text-3xl font-extrabold">You've completed {completedRows.length} of {prioritized.length} items</h3>
                <p className="mt-2 text-sm font-semibold text-slate-300">Inventory snapshot, pending status, and completed status stay in this browser.</p>
              </div>
              <button type="button" onClick={() => { setItemStatuses({}); setConfirmingItemId(null); setCompletionMessage('Session reset. Start with the highest-profit item.'); }} className="bg-white text-ink">Reset Session</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">Potential Recovered</p><p className="mt-2 text-4xl font-black text-[#7AF59A]">${potentialRecovered.toFixed(0)}</p><p className="mt-2 text-xs font-bold text-slate-300">Based on applied fixes</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Pending Potential</p><p className="mt-2 text-4xl font-black">${pendingPotential.toFixed(0)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Remaining Recovery</p><p className="mt-2 text-4xl font-black">${remainingRecoverable.toFixed(0)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Session Potential</p><p className="mt-2 text-4xl font-black">${totalRecoverable.toFixed(0)}</p></div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 text-sm font-extrabold">Active: {activeRows.length}</div>
              <div className="rounded-2xl bg-white/10 p-4 text-sm font-extrabold">Pending: {pendingRows.length}</div>
              <div className="rounded-2xl bg-white/10 p-4 text-sm font-extrabold">Completed: {completedRows.length}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <ScoreCard title="Weekly Items Fixed" value={weeklySummary.itemsFixed} helper="Applied fixes saved in this browser." tone="success" />
            <ScoreCard title="Weekly Profit Impact" value={`$${weeklySummary.estimatedProfitImpact.toFixed(0)}`} helper="Estimated potential recovered from applied fixes." tone="success" />
            <ScoreCard title="Fix Now Items" value={activeRows.filter((row) => row.analysis.deadListingRisk.riskScore >= 30).length} helper="Active items still waiting in this session." tone="danger" />
            <ScoreCard title="Current ROI" value={`${averageRoi}%`} helper="Average ROI before recovery fixes." tone={averageRoi < 50 ? 'warning' : 'success'} />
          </div>

          <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Active Checklist</p><h3 className="mt-1 text-2xl font-extrabold text-ink">Top items to fix first</h3></div><p className="text-sm font-bold text-slate-600">Apply the fix, then confirm what happened</p></div>
            <div className="mt-5 space-y-4">
              {topItems.length ? topItems.map((row, index) => {
                const { item, input, analysis, current, fixed, band } = row;
                return (
                  <div key={item.id} className="rounded-2xl border border-tan/80 bg-ivory p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sage">Priority {index + 1}</p><h4 className="mt-2 text-xl font-extrabold text-ink">{item.title}</h4><p className="mt-2 text-sm font-bold text-slate-600">{item.platform} - {item.condition || 'Condition missing'} - shipping ${item.shipping.toFixed(2)}</p></div><div className="flex flex-wrap gap-2"><RiskBadge level={analysis.deadListingRisk.riskLevel} /><span className="rounded-full bg-[#070A18] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white">Fix Now: {analysis.deadListingRisk.recommendedAction}</span></div></div>
                    <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_0.9fr_1fr]"><div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Outcome</p><p className="mt-2 text-sm font-bold text-slate-700">Price ${current.price.toFixed(0)}</p><p className="mt-1 text-sm font-bold text-slate-700">ROI {current.roi}%</p><p className="mt-1 text-sm font-bold text-red-700">Risk {analysis.deadListingRisk.riskScore}</p></div><div className="rounded-2xl bg-[#070A18] p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix Outcome</p><p className="mt-2 text-sm font-bold">New price ${fixed.price.toFixed(0)}</p><p className="mt-1 text-sm font-bold">New ROI {fixed.roi}%</p><p className="mt-2 text-xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} potential profit</p></div><div className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Why this is first</p><p className="mt-2">{moneyReason(input, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore)}</p><p className="mt-2">Realistic price band: ${band.low.toFixed(0)}-${band.high.toFixed(0)}</p></div></div>
                    <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#070A18] p-4 text-white lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#7AF59A]">Daily action</p><p className="mt-2 text-lg font-extrabold">Use title: {optimizedTitle(input)}</p><p className="mt-2 text-sm font-semibold text-slate-200">Price inside ${band.low.toFixed(0)}-${band.high.toFixed(0)}, then {analysis.deadListingRisk.recommendedAction.toLowerCase()} before sourcing another item.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => recheckItem(row)} className="bg-white text-ink">Re-check item</button><button type="button" onClick={() => setConfirmingItemId(item.id)} className="bg-[#7AF59A] text-[#070A18]">Mark as Fixed</button></div></div>
                    {confirmingItemId === item.id ? <div className="mt-3 rounded-2xl border border-[#FFD36B]/60 bg-[#FFD36B]/10 p-4"><p className="text-sm font-extrabold text-ink">Did you apply this fix?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => completeAppliedFix(item.id, fixed.improvement)} className="bg-[#070A18] text-white">Yes</button><button type="button" onClick={() => moveToPending(item.id)} className="bg-white text-ink">Not yet</button></div></div> : null}
                  </div>
                );
              }) : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Active list complete</p><h4 className="mt-2 text-2xl font-extrabold">No active fixes left.</h4><p className="mt-2 text-sm font-bold text-emerald-800">Finish pending fixes, reset the session, or upload another batch.</p></div>}
            </div>
          </div>

          {pendingRows.length ? <div className="rounded-2xl border border-[#FFD36B]/50 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A5A00]">Pending Fixes</p><div className="mt-4 grid gap-3 md:grid-cols-2">{pendingRows.map((row) => <div key={row.item.id} className="rounded-2xl border border-[#FFD36B]/60 bg-[#FFD36B]/10 p-4 text-ink"><p className="text-sm font-extrabold">{row.item.title}</p><p className="mt-1 text-sm font-bold text-slate-700">${row.fixed.improvement.toFixed(0)} pending potential</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => completeAppliedFix(row.item.id, row.fixed.improvement)} className="bg-[#070A18] text-white">Applied Now</button><button type="button" onClick={() => movePendingToActive(row.item.id)} className="bg-white text-ink">Move to Active</button><button type="button" onClick={() => recheckItem(row)} className="bg-white text-ink">Re-check item</button></div></div>)}</div></div> : null}

          {completedRows.length ? <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Completed This Session</p><div className="mt-4 grid gap-3 md:grid-cols-2">{completedRows.map((row) => <div key={row.item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><p className="text-sm font-extrabold">✓ {row.item.title}</p><p className="mt-1 text-sm font-bold text-emerald-800">${row.fixed.improvement.toFixed(0)} potential recovered (based on applied fix)</p><button type="button" onClick={() => recheckItem(row)} className="mt-3 bg-white text-ink">Re-check item</button></div>)}</div></div> : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-tan bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Ready When You Are</p><h3 className="mt-3 text-3xl font-extrabold text-ink">Upload, confirm, then run the recovery analysis.</h3><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">ResaleIQ detects likely columns first. Once titles and prices are found, the next step is recovery analysis.</p></div>
      )}
    </section>
  );
}
