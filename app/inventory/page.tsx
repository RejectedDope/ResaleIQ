'use client';

import { type DragEvent, useEffect, useMemo, useState } from 'react';
import { RiskBadge } from '@/components/RiskBadge';
import { ScoreCard } from '@/components/ScoreCard';
import { analyzeListing } from '@/lib/listingGenerator';
import type { ListingInput } from '@/lib/types';

type InventorySource = 'sample' | 'file' | 'photo' | 'manual';
type ItemStatus = 'active' | 'pending' | 'completed';
type ParsedRow = Record<string, string | number | boolean | null | undefined>;
type InventoryField = 'title' | 'price' | 'cost' | 'platform' | 'condition' | 'shipping';
type ColumnMap = Record<InventoryField, string>;

type InventoryItem = {
  id: number;
  title: string;
  price: number;
  cost: number;
  platform: string;
  condition: string;
  shipping: number;
  status: ItemStatus;
  source: InventorySource;
  photoUrl?: string;
};

type WeeklySummary = {
  itemsFixed: number;
  estimatedProfitImpact: number;
};

type SnapshotItem = InventoryItem & {
  roi: number;
  risk: number;
};

type InventorySnapshot = {
  savedAt: string;
  items: SnapshotItem[];
};

type RowAnalysis = {
  item: InventoryItem;
  input: ListingInput;
  analysis: ReturnType<typeof analyzeListing>;
  current: { price: number; profit: number; roi: number };
  fixed: { price: number; profit: number; roi: number; improvement: number };
  band: { low: number; high: number };
};

type ChangeSummary = {
  improved: number;
  stillAtRisk: number;
  worse: number;
  priceChanges: number;
};

const MAX_IMPORT_ROWS = 100;
const INVENTORY_ITEMS_KEY = 'resaleiq-inventory-workspace-items';
const INVENTORY_SNAPSHOT_KEY = 'resaleiq-inventory-snapshot';
const WEEKLY_SUMMARY_KEY = 'resaleiq-weekly-summary';

const STARTER_ITEMS: InventoryItem[] = [
  { id: 1, title: 'Nike Tech Fleece Joggers Gray Mens Medium', price: 42, cost: 18, platform: 'eBay', condition: 'pre-owned good', shipping: 7.5, status: 'active', source: 'sample' },
  { id: 2, title: 'Coach Leather Crossbody Bag Brown Vintage', price: 58, cost: 24, platform: 'Poshmark', condition: 'pre-owned fair', shipping: 0, status: 'active', source: 'sample' },
  { id: 3, title: 'Lululemon Align Leggings Black Size 6', price: 46, cost: 16, platform: 'Mercari', condition: 'pre-owned good', shipping: 6.25, status: 'active', source: 'sample' },
  { id: 4, title: 'Carhartt Work Jacket Faded Brown Large', price: 64, cost: 32, platform: 'eBay', condition: 'pre-owned worn', shipping: 10.5, status: 'active', source: 'sample' },
  { id: 5, title: 'Madewell High Rise Jeans Blue Size 28', price: 34, cost: 12, platform: 'Poshmark', condition: 'pre-owned good', shipping: 0, status: 'active', source: 'sample' },
];

const EMPTY_MAPPING: ColumnMap = { title: '', price: '', cost: '', platform: '', condition: '', shipping: '' };
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

function text(value: unknown) {
  return String(value ?? '').trim();
}

function columnKey(column: string) {
  return column.toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function compactColumn(column: string) {
  return columnKey(column).replace(/\s/g, '');
}

function itemKey(title: string) {
  return columnKey(title).slice(0, 80);
}

function isMeaningfulColumn(column: string) {
  const compact = compactColumn(column);
  return Boolean(compact && !/^empty\d*$/.test(compact) && !/^__empty\d*$/.test(compact) && compact !== 'blank');
}

function sampleValues(rows: ParsedRow[], column: string) {
  return rows.slice(0, 12).map((row) => row[column]).filter((value) => text(value));
}

function textScore(rows: ParsedRow[], column: string) {
  const values = sampleValues(rows, column);
  const textValues = values.filter((value) => text(value).length >= 4 && toNumber(value) === 0 && /[a-z]/i.test(text(value)));
  return textValues.length * 2 + textValues.reduce((sum, value) => sum + text(value).length, 0) / Math.max(textValues.length, 1) / 12;
}

function moneyScore(rows: ParsedRow[], column: string) {
  const values = sampleValues(rows, column);
  if (!values.length) return 0;
  return values.map(toNumber).filter((value) => value > 0 && value < 100000).length / values.length;
}

function wordScore(rows: ParsedRow[], column: string, words: string[]) {
  const values = sampleValues(rows, column).map((value) => text(value).toLowerCase());
  if (!values.length) return 0;
  return values.filter((value) => words.some((word) => value.includes(word))).length / values.length;
}

function detectHeader(columns: string[], field: InventoryField) {
  const aliases = FIELD_ALIASES[field];
  const normalizedAliases = aliases.map(columnKey);
  const compactAliases = aliases.map(compactColumn);
  const matches = columns.map((column) => ({ column, normalized: columnKey(column), compact: compactColumn(column) }));
  const exact = matches.find(({ normalized, compact }) => normalizedAliases.includes(normalized) || compactAliases.includes(compact));
  if (exact) return exact.column;
  const fuzzy = matches.find(({ normalized, compact }) => normalizedAliases.some((alias) => normalized.includes(alias) || alias.includes(normalized)) || compactAliases.some((alias) => compact.includes(alias) || alias.includes(compact)));
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

function toListingInput(item: InventoryItem, index: number): ListingInput {
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
    notes: 'Inventory workspace item',
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

function optimizedTitle(input: ListingInput) {
  return [input.brand, input.title, input.condition].filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 80);
}

function sourceLabel(source: InventorySource) {
  if (source === 'file') return 'File';
  if (source === 'photo') return 'Photo';
  if (source === 'manual') return 'Manual';
  return 'Sample';
}

function statusClass(status: ItemStatus) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-900';
  if (status === 'pending') return 'bg-amber-100 text-amber-900';
  return 'bg-slate-900 text-white';
}

function cleanRows(rows: ParsedRow[], mapping: ColumnMap) {
  return rows.slice(0, MAX_IMPORT_ROWS).map((row, index) => ({
    id: index,
    title: text(row[mapping.title]),
    price: toNumber(row[mapping.price]),
    cost: toNumber(row[mapping.cost]),
    platform: text(row[mapping.platform]) || 'eBay',
    condition: text(row[mapping.condition]).toLowerCase() || 'condition missing',
    shipping: toNumber(row[mapping.shipping]),
    status: 'active' as ItemStatus,
    source: 'file' as InventorySource,
  }));
}

async function parseInventoryFile(file: File) {
  const XLSX = await import('xlsx');
  const extension = file.name.split('.').pop()?.toLowerCase();
  const workbook = extension === 'csv' ? XLSX.read(await file.text(), { type: 'string' }) : XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ParsedRow>(firstSheet, { defval: '' });
  return { rows, columns: Object.keys(rows[0] ?? {}).filter(isMeaningfulColumn) };
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function makeSnapshot(rows: RowAnalysis[]): InventorySnapshot {
  return {
    savedAt: new Date().toISOString(),
    items: rows.map(({ item, current, analysis }) => ({ ...item, roi: current.roi, risk: analysis.deadListingRisk.riskScore })),
  };
}

function compareSnapshots(current: InventorySnapshot, previous?: InventorySnapshot | null): ChangeSummary | null {
  if (!previous?.items.length) return null;
  const previousByTitle = new Map(previous.items.map((item) => [itemKey(item.title), item]));
  return current.items.reduce((summary, item) => {
    const previousItem = previousByTitle.get(itemKey(item.title));
    if (!previousItem) return summary;
    const improved = item.roi > previousItem.roi || item.risk < previousItem.risk;
    const worse = item.roi < previousItem.roi || item.risk > previousItem.risk;
    return {
      improved: summary.improved + (improved ? 1 : 0),
      stillAtRisk: summary.stillAtRisk + (item.risk >= 30 && item.status !== 'completed' ? 1 : 0),
      worse: summary.worse + (worse && !improved ? 1 : 0),
      priceChanges: summary.priceChanges + (Math.abs(item.price - previousItem.price) >= 1 ? 1 : 0),
    };
  }, { improved: 0, stillAtRisk: 0, worse: 0, priceChanges: 0 });
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(STARTER_ITEMS);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMap>(EMPTY_MAPPING);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({ itemsFixed: 0, estimatedProfitImpact: 0 });
  const [savedSnapshot, setSavedSnapshot] = useState<InventorySnapshot | null>(null);
  const [changeSummary, setChangeSummary] = useState<ChangeSummary | null>(null);
  const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const savedItems = window.localStorage.getItem(INVENTORY_ITEMS_KEY);
      const savedSummary = window.localStorage.getItem(WEEKLY_SUMMARY_KEY);
      const savedSnapshotJson = window.localStorage.getItem(INVENTORY_SNAPSHOT_KEY);
      const parsedSnapshot: InventorySnapshot | null = savedSnapshotJson ? JSON.parse(savedSnapshotJson) : null;
      if (savedItems) setItems(JSON.parse(savedItems));
      else if (parsedSnapshot?.items.length) setItems(parsedSnapshot.items.map(({ roi, risk, ...item }) => item));
      if (savedSummary) setWeeklySummary(JSON.parse(savedSummary));
      if (parsedSnapshot) {
        setSavedSnapshot(parsedSnapshot);
        setHasRun(true);
        setMessage('Resumed your last inventory workspace.');
      }
    } catch {
      window.localStorage.removeItem(INVENTORY_ITEMS_KEY);
      window.localStorage.removeItem(WEEKLY_SUMMARY_KEY);
      window.localStorage.removeItem(INVENTORY_SNAPSHOT_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  const rows = useMemo<RowAnalysis[]>(() => items.map((item, index) => {
    const input = toListingInput(item, index);
    const analysis = analyzeListing(input);
    const current = currentOutcome(input, analysis.deadListingRisk.riskScore);
    const fixed = fixedOutcome(input, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore);
    return { item, input, analysis, current, fixed, band: pricingBand(input, analysis.deadListingRisk.riskScore) };
  }), [items]);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(INVENTORY_ITEMS_KEY, JSON.stringify(items));
    window.localStorage.setItem(WEEKLY_SUMMARY_KEY, JSON.stringify(weeklySummary));
  }, [hasHydrated, items, weeklySummary]);

  useEffect(() => {
    if (!hasHydrated || !hasRun || !rows.length) return;
    const snapshot = makeSnapshot(rows);
    window.localStorage.setItem(INVENTORY_SNAPSHOT_KEY, JSON.stringify(snapshot));
    setSavedSnapshot(snapshot);
  }, [hasHydrated, hasRun, rows]);

  const validRows = rows.filter((row) => row.item.title.trim() && row.item.price > 0);
  const prioritized = [...validRows].sort((a, b) => b.fixed.improvement - a.fixed.improvement || b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore);
  const activeRows = prioritized.filter((row) => row.item.status === 'active');
  const pendingRows = prioritized.filter((row) => row.item.status === 'pending');
  const completedRows = prioritized.filter((row) => row.item.status === 'completed');
  const topItems = activeRows.slice(0, 5);
  const totalRecoverable = activeRows.concat(pendingRows).reduce((sum, row) => sum + row.fixed.improvement, 0);
  const potentialRecovered = completedRows.reduce((sum, row) => sum + row.fixed.improvement, 0);
  const pendingPotential = pendingRows.reduce((sum, row) => sum + row.fixed.improvement, 0);
  const averageRoi = Math.round(prioritized.reduce((sum, row) => sum + row.current.roi, 0) / Math.max(prioritized.length, 1));
  const itemSummary = {
    total: items.length,
    missingTitles: items.filter((item) => !item.title.trim()).length,
    priceProblems: items.filter((item) => item.price <= 0).length,
  };
  const canAnalyzeItems = items.length > 0 && itemSummary.missingTitles === 0 && itemSummary.priceProblems === 0;
  const previewColumns = FIELD_LABELS.map((field) => mapping[field.key]).filter(Boolean);
  const importedRows = parsedRows.slice(0, MAX_IMPORT_ROWS);
  const canAddDetectedRows = parsedRows.length > 0 && Boolean(mapping.title && mapping.price);
  const rowById = new Map(rows.map((row) => [row.item.id, row]));

  const nextId = (current: InventoryItem[]) => Math.max(0, ...current.map((item) => item.id)) + 1;

  const resetAnalysis = (nextMessage = '') => {
    setHasRun(false);
    setChangeSummary(null);
    setConfirmingItemId(null);
    setMessage(nextMessage);
  };

  const appendItems = (incoming: InventoryItem[], nextMessage: string) => {
    setItems((current) => {
      const start = nextId(current);
      const available = Math.max(0, MAX_IMPORT_ROWS - current.length);
      const normalized = incoming.slice(0, available).map((item, index) => ({ ...item, id: start + index }));
      return [...current, ...normalized];
    });
    resetAnalysis(nextMessage);
  };

  const updateItem = (id: number, key: keyof InventoryItem, value: string | number) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    resetAnalysis();
  };

  const updateStatus = (id: number, status: ItemStatus) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const addManualItem = () => {
    appendItems([{ id: 0, title: '', price: 0, cost: 0, platform: 'eBay', condition: '', shipping: 0, status: 'active', source: 'manual' }], 'Manual item added. Add title and price to put it in the fix list.');
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    resetAnalysis();
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setIsParsing(true);
    setWarnings([]);
    setShowFieldEditor(false);
    try {
      const parsed = await parseInventoryFile(file);
      const detected = inferMapping(parsed.columns, parsed.rows);
      setFileName(file.name);
      setParsedRows(parsed.rows);
      setColumns(parsed.columns);
      setMapping(detected);
      if (!parsed.rows.length) setWarnings(['We could not find inventory rows in this file.']);
      else if (detected.title && detected.price) {
        const cleaned = cleanRows(parsed.rows, detected).filter((item) => item.title || item.price > 0);
        appendItems(cleaned, `${Math.min(cleaned.length, MAX_IMPORT_ROWS - items.length)} file rows added to Your Inventory.`);
        setWarnings(parsed.rows.length > MAX_IMPORT_ROWS ? [`This file has more than ${MAX_IMPORT_ROWS} rows, so the first ${MAX_IMPORT_ROWS} were added.`] : []);
      } else {
        setWarnings(['We need a title column and price column before adding these rows.']);
        setShowFieldEditor(true);
      }
    } catch {
      setWarnings(['We could not read this file. Try a simple CSV or single-sheet Excel file.']);
    } finally {
      setIsParsing(false);
    }
  };

  const addMappedRows = () => {
    if (!canAddDetectedRows) {
      setWarnings(['We need a title column and price column before adding these rows.']);
      setShowFieldEditor(true);
      return;
    }
    const cleaned = cleanRows(parsedRows, mapping).filter((item) => item.title || item.price > 0);
    appendItems(cleaned, `${cleaned.length} file rows added to Your Inventory.`);
    setParsedRows([]);
    setColumns([]);
    setMapping(EMPTY_MAPPING);
    setFileName('');
    setShowFieldEditor(false);
  };

  const handlePhotos = async (files?: FileList | null) => {
    if (!files?.length) return;
    const photos = await Promise.all(Array.from(files).filter((file) => file.type.startsWith('image/')).map(readImage));
    appendItems(photos.map((photoUrl) => ({ id: 0, title: '', price: 0, cost: 0, platform: 'eBay', condition: 'condition missing', shipping: 0, status: 'active', source: 'photo', photoUrl })), `${photos.length} photo items added. Add quick titles and prices to analyze them.`);
  };

  const runAnalysis = () => {
    if (!canAnalyzeItems) {
      setWarnings(['Every item needs a title and price above $0 before recovery analysis can run.']);
      return;
    }
    const snapshot = makeSnapshot(rows);
    setChangeSummary(compareSnapshots(snapshot, savedSnapshot));
    setHasRun(true);
    setMessage('Recovery analysis saved. Start with the first item in Today\'s Fix List.');
  };

  const completeAppliedFix = (row: RowAnalysis) => {
    updateStatus(row.item.id, 'completed');
    setWeeklySummary((current) => ({ itemsFixed: current.itemsFixed + 1, estimatedProfitImpact: current.estimatedProfitImpact + row.fixed.improvement }));
    setConfirmingItemId(null);
    setMessage(`Nice - $${row.fixed.improvement.toFixed(0)} potential recovered based on the fix you applied.`);
  };

  const startFresh = () => {
    window.localStorage.removeItem(INVENTORY_ITEMS_KEY);
    window.localStorage.removeItem(INVENTORY_SNAPSHOT_KEY);
    setItems([]);
    setSavedSnapshot(null);
    setHasRun(false);
    setWarnings([]);
    setMessage('Started a fresh inventory workspace.');
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handlePhotoDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsPhotoDragging(false);
    handlePhotos(event.dataTransfer.files);
  };

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">Your Inventory</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Today's Fix List</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-300">
              Start with the items most likely to recover profit. The full inventory is still here, but the next move is already prioritized.
            </p>
          </div>
          <div className="rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5 text-[#7AF59A]">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Total recoverable</p>
            <p className="mt-2 text-5xl font-black">${totalRecoverable.toFixed(0)}</p>
            <p className="mt-2 text-sm font-bold text-slate-200">From {activeRows.length + pendingRows.length} open items</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard title="Total Recoverable" value={`$${totalRecoverable.toFixed(0)}`} helper="Open profit lift from active and pending items." tone="dark" />
        <ScoreCard title="Items To Fix" value={activeRows.length} helper="Sorted by profit improvement and risk." tone={activeRows.length ? 'danger' : 'success'} />
        <ScoreCard title="Session Progress" value={`${completedRows.length}/${Math.max(prioritized.length, 1)}`} helper="Completed fixes from this batch." tone={completedRows.length ? 'success' : 'neutral'} />
        <ScoreCard title="Pending Fixes" value={pendingRows.length} helper="Chosen fixes not applied yet." tone={pendingRows.length ? 'warning' : 'success'} />
      </div>

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Action First</p>
            <h2 className="mt-1 text-3xl font-extrabold text-ink">Fix these before scanning inventory</h2>
          </div>
          <button type="button" onClick={runAnalysis} disabled={!canAnalyzeItems} className="bg-[#070A18] px-6 py-4 text-base font-extrabold text-white hover:bg-[#2B185F] disabled:opacity-40">
            {canAnalyzeItems ? 'Run Recovery Analysis' : 'Add titles and prices first'}
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {topItems.length ? topItems.map((row, index) => {
            const { item, input, analysis, current, fixed, band } = row;
            return (
              <div key={item.id} className="rounded-2xl border border-tan/80 bg-ivory p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    {item.photoUrl ? <img src={item.photoUrl} alt="Inventory upload" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{sourceLabel(item.source)}</div>}
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sage">Fix {index + 1}</p>
                      <h3 className="mt-2 text-xl font-extrabold text-ink">{item.title}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-600">{item.platform} - ROI {current.roi}% - risk {analysis.deadListingRisk.riskScore}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                    <span className="rounded-full bg-[#070A18] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white">Fix Now: {analysis.deadListingRisk.recommendedAction}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[0.85fr_0.85fr_1.2fr_auto]">
                  <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current</p><p className="mt-2 text-sm font-bold text-slate-700">Price ${current.price.toFixed(0)}</p><p className="mt-1 text-sm font-bold text-slate-700">ROI {current.roi}%</p></div>
                  <div className="rounded-2xl bg-[#070A18] p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix</p><p className="mt-2 text-sm font-bold">New price ${fixed.price.toFixed(0)}</p><p className="mt-1 text-xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} profit</p></div>
                  <div className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Apply this</p><p className="mt-2">Title: {optimizedTitle(input)}</p><p>Price between ${band.low.toFixed(0)}-${band.high.toFixed(0)}</p></div>
                  <div className="flex flex-col gap-2 lg:min-w-[150px]"><button type="button" onClick={() => setConfirmingItemId(item.id)} className="bg-[#7AF59A] text-[#070A18]">Mark as Fixed</button><button type="button" onClick={() => setMessage(`${item.title} re-checked. Current ROI is ${current.roi}% and risk is ${analysis.deadListingRisk.riskScore}.`)} className="bg-white text-ink">Re-check</button></div>
                </div>

                {confirmingItemId === item.id ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-extrabold text-ink">Did you apply this fix?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => completeAppliedFix(row)} className="bg-[#070A18] text-white">Yes</button><button type="button" onClick={() => { updateStatus(item.id, 'pending'); setConfirmingItemId(null); setMessage('Saved to Pending Fixes.'); }} className="bg-white text-ink">Not yet</button></div></div> : null}
              </div>
            );
          }) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">No active fixes</p><h3 className="mt-2 text-2xl font-extrabold">Your fix list is clear.</h3><p className="mt-2 text-sm font-bold text-emerald-800">Add priced inventory or move pending fixes back to active.</p></div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Add Inventory</p><h2 className="mt-1 text-2xl font-extrabold text-ink">Upload, photo, or manual entry</h2></div>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={addManualItem} disabled={items.length >= MAX_IMPORT_ROWS} className="bg-ivory text-ink disabled:opacity-40">Add Item Manually</button><button type="button" onClick={startFresh} className="bg-white text-red-700">Start Fresh</button>{!items.length ? <button type="button" onClick={() => appendItems(STARTER_ITEMS, 'Sample inventory restored.')} className="bg-ivory text-ink">Load Samples</button> : null}</div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <label onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleDrop(event); }} className={`flex min-h-[150px] cursor-pointer flex-col justify-center rounded-2xl border-2 border-dashed p-5 transition ${isDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'}`}><span className="text-lg font-extrabold text-ink">Upload file</span><span className="mt-2 text-sm font-bold text-slate-600">Drop CSV or Excel. Rows add to the same inventory.</span><input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => handleFile(event.target.files?.[0])} /><span className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700">{isParsing ? 'Reading file...' : fileName ? `Loaded: ${fileName}` : 'CSV, XLSX, XLS'}</span></label>
          <label onDragOver={(event) => { event.preventDefault(); setIsPhotoDragging(true); }} onDragLeave={() => setIsPhotoDragging(false)} onDrop={handlePhotoDrop} className={`flex min-h-[150px] cursor-pointer flex-col justify-center rounded-2xl border-2 border-dashed p-5 transition ${isPhotoDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'}`}><span className="text-lg font-extrabold text-ink">Upload photos</span><span className="mt-2 text-sm font-bold text-slate-600">Add thumbnails, then quick titles and prices.</span><input className="hidden" type="file" accept="image/*" multiple onChange={(event) => handlePhotos(event.target.files)} /><span className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700">Multiple images supported</span></label>
          <div className="flex min-h-[150px] flex-col justify-center rounded-2xl border border-tan bg-ivory p-5"><span className="text-lg font-extrabold text-ink">Manual entry</span><span className="mt-2 text-sm font-bold text-slate-600">Add one-off items without a spreadsheet.</span><button type="button" onClick={addManualItem} disabled={items.length >= MAX_IMPORT_ROWS} className="mt-4 bg-[#070A18] text-white disabled:opacity-40">Add Manual Item</button></div>
        </div>

        {columns.length && parsedRows.length && !canAddDetectedRows ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Needs one adjustment</p><h3 className="mt-2 text-xl font-extrabold">We need a title column and price column before adding these rows.</h3></div><button type="button" onClick={() => setShowFieldEditor((value) => !value)} className="bg-white text-ink">Adjust Fields</button></div>{showFieldEditor ? <div className="mt-4 grid gap-3 md:grid-cols-2">{FIELD_LABELS.map((field) => <label key={field.key} className="text-sm font-bold text-slate-700">{field.label}{field.required ? ' required' : ''}<select value={mapping[field.key]} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}><option value="">Leave blank</option>{columns.map((column) => <option key={column} value={column}>{column}</option>)}</select></label>)}</div> : null}<button type="button" onClick={addMappedRows} className="mt-4 bg-[#070A18] text-white">Add Detected Rows</button></div> : null}

        {previewColumns.length ? <div className="mt-5 rounded-2xl border border-tan bg-ivory p-4"><div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">File Preview</p><h3 className="mt-1 text-xl font-extrabold text-ink">Detected columns are ready</h3></div><p className="text-sm font-bold text-slate-600">{importedRows.length} rows detected</p></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{previewColumns.map((column) => <th key={column} className="px-3 py-2">{column}</th>)}</tr></thead><tbody className="font-semibold text-slate-700">{importedRows.slice(0, 5).map((row, index) => <tr key={index} className="border-t border-tan/70">{previewColumns.map((column) => <td key={column} className="max-w-[220px] truncate px-3 py-3">{text(row[column]) || '-'}</td>)}</tr>)}</tbody></table></div></div> : null}
      </div>

      {warnings.length ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Needs attention</p><ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">{warnings.map((warning) => <li key={warning}>- {warning}</li>)}</ul></div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Workspace saved</p><h3 className="mt-2 text-2xl font-extrabold">{message}</h3></div> : null}

      {changeSummary ? <div className="grid gap-4 md:grid-cols-4"><ScoreCard title="Items Improved" value={changeSummary.improved} helper="ROI improved or risk dropped since the last snapshot." tone="success" /><ScoreCard title="Still At Risk" value={changeSummary.stillAtRisk} helper="Items still above the action threshold." tone={changeSummary.stillAtRisk ? 'warning' : 'success'} /><ScoreCard title="Got Worse" value={changeSummary.worse} helper="ROI dropped or risk increased." tone={changeSummary.worse ? 'danger' : 'success'} /><ScoreCard title="Price Changes" value={changeSummary.priceChanges} helper="Items with a changed current price." tone="dark" /></div> : null}

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Full Inventory</p><h2 className="mt-1 text-2xl font-extrabold text-ink">Secondary list for managing every item</h2></div><button type="button" onClick={runAnalysis} disabled={!canAnalyzeItems} className="bg-[#070A18] px-6 py-4 text-base font-extrabold text-white hover:bg-[#2B185F] disabled:opacity-40">{canAnalyzeItems ? 'Run Recovery Analysis' : 'Add titles and prices first'}</button></div>
        <div className="mt-5 grid gap-3 md:grid-cols-4"><ScoreCard title="Total Items" value={itemSummary.total} helper="All input methods feed this count." tone="dark" /><ScoreCard title="Needs Title" value={itemSummary.missingTitles} helper="Photo/manual items may need quick naming." tone={itemSummary.missingTitles ? 'warning' : 'success'} /><ScoreCard title="Needs Price" value={itemSummary.priceProblems} helper="Price must be above $0 for analysis." tone={itemSummary.priceProblems ? 'warning' : 'success'} /><ScoreCard title="Average ROI" value={`${averageRoi}%`} helper="Average ROI before recovery fixes." tone={averageRoi < 50 ? 'warning' : 'success'} /></div>
        <div className="mt-5 space-y-3">
          {items.length ? items.map((item, index) => {
            const row = rowById.get(item.id);
            const missingTitle = !item.title.trim();
            const priceProblem = item.price <= 0;
            return <div key={item.id} className={`grid gap-3 rounded-2xl border p-4 lg:grid-cols-[96px_1.4fr_0.65fr_0.65fr_0.7fr_0.7fr_0.8fr_auto] ${missingTitle || priceProblem ? 'border-amber-200 bg-amber-50' : 'border-tan/80 bg-ivory'}`}><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{item.photoUrl ? <img src={item.photoUrl} alt="Inventory upload" className="h-full w-full object-cover" /> : sourceLabel(item.source)}</div><label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Title<input value={item.title} onChange={(event) => updateItem(item.id, 'title', event.target.value)} placeholder={`Item ${index + 1} title`} />{missingTitle ? <span className="mt-1 block text-xs text-amber-700">Add quick title</span> : null}</label><label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Price<input type="number" min={0} step="0.01" value={item.price} onChange={(event) => updateItem(item.id, 'price', Number(event.target.value))} />{priceProblem ? <span className="mt-1 block text-xs text-amber-700">Add price</span> : null}</label><label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Cost<input type="number" min={0} step="0.01" value={item.cost} onChange={(event) => updateItem(item.id, 'cost', Number(event.target.value))} /></label><label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Platform<input value={item.platform} onChange={(event) => updateItem(item.id, 'platform', event.target.value)} /></label><label className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Condition<input value={item.condition} onChange={(event) => updateItem(item.id, 'condition', event.target.value)} /></label><div className="flex flex-col justify-end gap-2"><span className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${statusClass(item.status)}`}>{item.status}</span><span className="text-sm font-extrabold text-slate-700">ROI {row && !missingTitle && !priceProblem ? `${row.current.roi}%` : '--'}</span><span className="text-sm font-extrabold text-slate-700">Risk {row && !missingTitle && !priceProblem ? row.analysis.deadListingRisk.riskScore : '--'}</span></div><button type="button" onClick={() => removeItem(item.id)} className="self-end bg-white text-red-700">Remove</button></div>;
          }) : <div className="rounded-2xl border border-dashed border-tan bg-ivory p-8 text-center"><p className="text-xl font-extrabold text-ink">No items yet.</p><p className="mt-2 text-sm font-bold text-slate-600">Upload a file, add photos, or add an item manually to start.</p></div>}
        </div>
      </div>

      {pendingRows.length ? <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Pending Fixes</p><div className="mt-4 grid gap-3 md:grid-cols-2">{pendingRows.map((row) => <div key={row.item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-ink"><p className="text-sm font-extrabold">{row.item.title}</p><p className="mt-1 text-sm font-bold text-slate-700">${row.fixed.improvement.toFixed(0)} pending potential</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => completeAppliedFix(row)} className="bg-[#070A18] text-white">Applied Now</button><button type="button" onClick={() => updateStatus(row.item.id, 'active')} className="bg-white text-ink">Move to Active</button></div></div>)}</div></div> : null}
      {completedRows.length ? <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Completed This Session</p><div className="mt-4 grid gap-3 md:grid-cols-2">{completedRows.map((row) => <div key={row.item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><p className="text-sm font-extrabold">Done: {row.item.title}</p><p className="mt-1 text-sm font-bold text-emerald-800">${row.fixed.improvement.toFixed(0)} potential recovered based on applied fix</p><button type="button" onClick={() => updateStatus(row.item.id, 'active')} className="mt-3 bg-white text-ink">Move to Active</button></div>)}</div></div> : null}
    </section>
  );
}
