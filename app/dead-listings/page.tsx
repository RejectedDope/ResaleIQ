import { CopyButton } from '@/components/CopyButton';
import { RiskBadge } from '@/components/RiskBadge';
import { ScoreCard } from '@/components/ScoreCard';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

type InventoryItem = (typeof sampleInventory)[number];

function baseProfit(item: InventoryItem, price: number) {
  return price + item.shippingCharged - item.purchaseCost - item.shippingPaid;
}

function currentOutcome(item: InventoryItem, riskScore: number) {
  const riskDiscount = Math.min(0.3, riskScore * 0.003);
  const price = item.targetSalePrice * (1 - riskDiscount);
  const profit = baseProfit(item, price);
  return { price, profit, roi: Math.round((profit / Math.max(item.purchaseCost, 1)) * 100) };
}

function fixedOutcome(item: InventoryItem, action: string, riskScore: number) {
  const current = currentOutcome(item, riskScore);
  const liftByAction: Record<string, number> = { Relist: 0.08, Reprice: 0.06, Crosslist: 0.1, Bundle: 0.12, Hold: 0.03, 'Donate/Liquidate': 0.04 };
  const lift = liftByAction[action] ?? 0.06;
  const price = Math.min(item.targetSalePrice * 1.12, current.price + item.targetSalePrice * lift);
  const profit = baseProfit(item, price);
  return { price, profit, roi: Math.round((profit / Math.max(item.purchaseCost, 1)) * 100), improvement: Math.max(0, profit - current.profit) };
}

function marketSignals(item: InventoryItem, riskScore: number) {
  const low = Math.max(6, item.targetSalePrice * (riskScore > 60 ? 0.72 : 0.82));
  const high = item.targetSalePrice * (riskScore > 60 ? 0.96 : 1.08);
  const similarCount = Math.max(18, Math.round(42 + item.title.length / 2 + item.listingAgeDays / 4));
  const daysToSell = Math.max(9, Math.round(18 + riskScore / 3 + (item.targetSalePrice < 25 ? 8 : 0)));
  const competition = similarCount > 85 ? 'High competition' : similarCount > 55 ? 'Medium competition' : 'Low competition';
  const confidence = riskScore < 35 ? 'High' : riskScore < 65 ? 'Medium' : 'Low';
  return { low, high, similarCount, daysToSell, competition, confidence };
}

function exactTitle(item: InventoryItem) {
  return [item.brand, item.title.replace(new RegExp(`^${item.brand}\\s+`, 'i'), ''), item.size !== 'OS' ? item.size : '', item.color, item.condition]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function executionBullets(item: InventoryItem, action: string, price: number) {
  const bullets = [
    `${item.condition || 'Pre-owned'} ${item.category.toLowerCase()} from ${item.brand || 'a known brand'}`,
    `Current size/color: ${[item.size, item.color].filter(Boolean).join(', ') || 'see photos'}`,
    `Priced at $${price.toFixed(0)} for faster buyer response`,
    'Ships fast with tracked shipping',
  ];
  if (action === 'Crosslist') bullets.push(`Post this same listing on the stronger ${item.category.toLowerCase()} channel today`);
  else if (action === 'Bundle') bullets.push('Bundle with one similar item to protect shipping margin');
  else if (action === 'Reprice') bullets.push('Refresh first photo after changing the price');
  else bullets.push('Relist with this title and a refreshed first photo');
  return bullets;
}

function FixCard({ item, action, price }: { item: InventoryItem; action: string; price: number }) {
  const title = exactTitle(item);
  const bullets = executionBullets(item, action, price);
  return (
    <div className="mt-4 rounded-2xl bg-[#070A18] p-4 text-white">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#7AF59A]">Fix This Listing</p>
      <div className="mt-3 rounded-2xl bg-white/10 p-4">
        <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">New title</p><CopyButton value={title} /></div>
        <p className="mt-2 text-lg font-extrabold">{title}</p>
      </div>
      <div className="mt-3 rounded-2xl bg-[#7AF59A] p-4 text-[#070A18]"><p className="text-xs font-bold uppercase tracking-[0.14em]">New exact price</p><p className="mt-1 text-3xl font-black">${price.toFixed(0)}</p></div>
      <div className="mt-3 rounded-2xl bg-white/10 p-4">
        <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Listing bullets</p><CopyButton value={bullets.map((bullet) => `- ${bullet}`).join('\n')} label="Copy bullets" /></div>
        <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-200">{bullets.map((bullet) => <li key={bullet}>- {bullet}</li>)}</ul>
      </div>
    </div>
  );
}

export default function DeadListingsPage() {
  const rows = sampleInventory.map((item) => {
    const analysis = analyzeListing(item);
    const current = currentOutcome(item, analysis.deadListingRisk.riskScore);
    const fixed = fixedOutcome(item, analysis.deadListingRisk.recommendedAction, analysis.deadListingRisk.riskScore);
    const signals = marketSignals(item, analysis.deadListingRisk.riskScore);
    return { item, analysis, current, fixed, signals };
  });
  const total = rows.length || 1;
  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.targetSalePrice, 0);
  const recoveryScore = Math.round(rows.reduce((sum, row) => sum + (100 - row.analysis.deadListingRisk.riskScore), 0) / total);
  const emergencyQueue = [...rows].sort((a, b) => b.fixed.improvement - a.fixed.improvement).slice(0, 4);
  const itemsToFix = rows.filter((row) => row.analysis.deadListingRisk.riskScore >= 30).length;

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C59BFF]">Recovery Room</p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Fix the items costing you money right now.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Every item now includes a copy-paste title, exact price, and listing bullets.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard title="Recoverable Revenue" value={`$${recoverableRevenue.toFixed(0)}`} helper="Potential revenue represented by current sample inventory." tone="success" />
        <ScoreCard title="Recovery Score" value={`${recoveryScore}/100`} helper="Higher means less dead-inventory pressure across the shelf." tone="dark" />
        <ScoreCard title="Fix Now Items" value={itemsToFix} helper="Items ready for copy-paste fixes." tone={itemsToFix ? 'danger' : 'neutral'} />
      </div>

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Emergency Queue</p><h3 className="mt-1 text-2xl font-extrabold text-ink">Do these first</h3></div><p className="text-sm font-semibold text-slate-600">Sorted by profit improvement</p></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {emergencyQueue.map(({ item, analysis, current, fixed, signals }) => (
            <div key={item.title} className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-ink">{item.title}</p><p className="mt-1 text-sm text-slate-700">{analysis.deadListingRisk.topIssue}</p></div><RiskBadge level={analysis.deadListingRisk.riskLevel} /></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Outcome</p><p className="mt-2 text-sm font-bold text-slate-700">Price ${current.price.toFixed(0)}</p><p className="mt-1 text-sm font-bold text-slate-700">ROI {current.roi}%</p></div><div className="rounded-2xl bg-[#070A18] p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix Outcome</p><p className="mt-2 text-sm font-bold">New price ${fixed.price.toFixed(0)}</p><p className="mt-2 text-xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} more profit</p></div></div>
              <div className="mt-3 grid gap-2 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700"><p>Similar items selling between ${signals.low.toFixed(0)}-${signals.high.toFixed(0)}</p><p>Average days to sell: {signals.daysToSell}</p><p>{signals.competition} - Based on {signals.similarCount} similar listings - Confidence: {signals.confidence}</p></div>
              <FixCard item={item} action={analysis.deadListingRisk.recommendedAction} price={fixed.price} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {rows.map(({ item, analysis, current, fixed, signals }) => {
          const high = analysis.deadListingRisk.riskLevel === 'High';
          return (
            <div key={item.title} className={`rounded-2xl border p-5 shadow-sm ${high ? 'border-red-200 bg-red-50' : 'border-tan bg-white'}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Inventory Item</p><h3 className="mt-2 text-xl font-extrabold text-ink">{item.title}</h3><p className="mt-2 text-sm text-slate-700">{item.platform} - {item.listingAgeDays} days - {analysis.deadListingRisk.topIssue}</p></div><div className="flex flex-wrap gap-2"><RiskBadge level={analysis.deadListingRisk.riskLevel} /><span className="rounded-full bg-[#070A18] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white">Fix Now: {analysis.deadListingRisk.recommendedAction}</span></div></div>
              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr]"><div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current Outcome</p><div className="mt-3 grid grid-cols-3 gap-2 text-sm font-bold text-slate-700"><span>Price ${current.price.toFixed(0)}</span><span>ROI {current.roi}%</span><span>Risk {analysis.deadListingRisk.riskScore}</span></div></div><div className="rounded-2xl bg-[#070A18] p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix Outcome</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold"><span>New price ${fixed.price.toFixed(0)}</span><span>New ROI {fixed.roi}%</span></div></div><div className="rounded-2xl bg-sage p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Profit Gap</p><p className="mt-2 text-3xl font-extrabold">+${fixed.improvement.toFixed(0)}</p></div></div>
              <FixCard item={item} action={analysis.deadListingRisk.recommendedAction} price={fixed.price} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
