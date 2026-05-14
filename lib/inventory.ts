export type NormalizedInventoryItem = {
  id: string;
  title?: string;
  platform?: string;
  category?: string;
  listedPrice?: number;
  cost?: number;
  shippingCost?: number;
  daysListed?: number;
  dateListed?: string;
  watchers?: number;
  views?: number;
  likes?: number;
  quantity?: number;
  sku?: string;
  notes?: string;
  raw: Record<string, string>;
};

export type AnalysisResult = {
  id: string;
  title: string;
  platform: string;
  listedPrice?: number;
  daysListed?: number;
  risk: 'low' | 'elevated' | 'high' | 'severe';
  problems: string[];
  recommendedActions: string[];
  confidence: 'Low' | 'Medium' | 'High';
  reasoning: string;
  nextAction: string;
  sections: string[];
};

const fieldMap: Record<keyof Omit<NormalizedInventoryItem, 'id' | 'raw'>, string[]> = {
  title: ['title', 'item title', 'listing title', 'name', 'product'],
  platform: ['platform', 'marketplace', 'channel'],
  category: ['category', 'type', 'department'],
  listedPrice: ['price', 'listed price', 'listing price', 'asking price', 'current price', 'listedprice'],
  cost: ['cost', 'buy cost', 'cogs', 'purchase price'],
  shippingCost: ['shipping', 'shipping cost', 'buyer shipping'],
  daysListed: ['days listed', 'age', 'listing age', 'days active'],
  dateListed: ['date listed', 'listed date', 'start date', 'created at'],
  watchers: ['watchers', 'watch count'],
  views: ['views', 'view count'],
  likes: ['likes', 'favorites'],
  quantity: ['quantity', 'qty'],
  sku: ['sku', 'custom label'],
  notes: ['notes', 'description'],
};

const norm = (s: string) => s.trim().toLowerCase();

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== '')) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => norm(h));
  return rows.slice(1).map((r) => {
    const out: Record<string, string> = {};
    headers.forEach((h, idx) => (out[h] = (r[idx] || '').trim()));
    return out;
  });
}

function n(v?: string): number | undefined {
  if (!v) return undefined;
  const cleaned = v.replace(/[$,%]/g, '').trim();
  const x = Number(cleaned);
  return Number.isFinite(x) ? x : undefined;
}

export function normalizeRows(rows: Record<string, string>[]) {
  const items: NormalizedInventoryItem[] = rows.map((raw, i) => {
    const item: NormalizedInventoryItem = { id: `row-${i + 1}`, raw };
    for (const [k, aliases] of Object.entries(fieldMap)) {
      const key = k as keyof Omit<NormalizedInventoryItem, 'id' | 'raw'>;
      const found = aliases.find((a) => raw[norm(a)] !== undefined);
      const value = found ? raw[norm(found)] : undefined;
      if (!value) continue;
      if (['listedPrice', 'cost', 'shippingCost', 'daysListed', 'watchers', 'views', 'likes', 'quantity'].includes(key)) {
        (item as any)[key] = n(value);
      } else {
        (item as any)[key] = value.trim();
      }
    }
    if (!item.daysListed && item.dateListed) {
      const d = new Date(item.dateListed);
      if (!Number.isNaN(d.getTime())) item.daysListed = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
    }
    return item;
  });

  const missingFields = new Set<string>();
  for (const i of items) {
    if (!i.title) missingFields.add('title');
    if (i.listedPrice === undefined && i.cost === undefined) missingFields.add('listedPrice or cost');
    if (i.daysListed === undefined && !i.dateListed) missingFields.add('daysListed or dateListed');
  }
  return { items, missingFields: Array.from(missingFields) };
}

export function analyzeInventory(items: NormalizedInventoryItem[]): AnalysisResult[] {
  return items.map((item) => {
    const problems: string[] = [];
    const actions = new Set<string>();
    const sections = new Set<string>();
    let risk: AnalysisResult['risk'] = 'low';

    const days = item.daysListed ?? 0;
    if (days > 365) { risk = 'severe'; problems.push('Listing stale over 365 days'); sections.add('High Stale Risk'); actions.add('Liquidate / Donate'); }
    else if (days > 180) { risk = 'high'; problems.push('Listing stale over 180 days'); sections.add('High Stale Risk'); actions.add('Relist / Sell Similar'); }
    else if (days > 90) { risk = 'elevated'; problems.push('Listing stale over 90 days'); sections.add('High Stale Risk'); actions.add('Relist / Sell Similar'); }

    const engagementKnown = item.views !== undefined || item.watchers !== undefined || item.likes !== undefined;
    const lowEngagement = (item.views ?? 0) < 5 && (item.watchers ?? 0) < 2 && (item.likes ?? 0) < 2;
    if (engagementKnown && lowEngagement) {
      problems.push('Low engagement signals (views/watchers/likes)');
      sections.add('Fix These First');
      actions.add('Improve Title');
    }

    if (item.listedPrice !== undefined && item.shippingCost !== undefined) {
      if (item.shippingCost > item.listedPrice * 0.2 || (item.listedPrice < 40 && item.shippingCost > 10)) {
        problems.push('Shipping friction likely suppressing conversion');
        sections.add('Shipping Friction');
        actions.add('Adjust Shipping');
      }
    } else if (item.shippingCost === undefined) {
      problems.push('Shipping data missing');
      sections.add('Data Gaps');
      actions.add('Needs More Data');
    }

    if ((item.title?.length ?? 0) < 12) {
      problems.push('Title too short for search coverage');
      sections.add('Listing Quality Fixes');
      actions.add('Improve Title');
    }
    if (!item.category || !item.platform) {
      problems.push('Missing category/platform metadata');
      sections.add('Data Gaps');
      actions.add('Add Item Specifics');
    }

    if (item.cost !== undefined && item.listedPrice !== undefined && days > 90 && item.listedPrice < item.cost * 1.35) {
      problems.push('Pricing may be resistant for current age and margin');
      sections.add('Pricing / Margin Review');
      actions.add('Reduce Price');
    }
    if ((item.quantity ?? 1) > 1 && days > 90) {
      problems.push('Multiple units tied up in stale listing');
      sections.add('Fix These First');
      actions.add('Crosspost Later');
    }

    if (!problems.length) {
      problems.push('No major risk found with available fields');
      sections.add('Fix These First');
      actions.add('Hold');
    }

    const reasoning = `${problems[0]}. ${engagementKnown ? 'Engagement signals were evaluated.' : 'Engagement signals unavailable.'}`;
    const recommendedActions = Array.from(actions);
    return {
      id: item.id,
      title: item.title || 'Untitled Item',
      platform: item.platform || 'Unknown Platform',
      listedPrice: item.listedPrice,
      daysListed: item.daysListed,
      risk,
      problems,
      recommendedActions,
      confidence: problems.length >= 3 ? 'High' : problems.length === 2 ? 'Medium' : 'Low',
      reasoning,
      nextAction: recommendedActions[0] || 'Needs More Data',
      sections: Array.from(sections),
    };
  });
}
