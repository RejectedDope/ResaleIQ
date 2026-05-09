'use client';

import { useMemo, useState } from 'react';
import { analyzeListing } from '@/lib/listingGenerator';
import { ListingInput } from '@/lib/types';

type RawRow = Record<string, unknown>;
const fields = [
  { key: 'title', label: 'Item Title' },
  { key: 'price', label: 'Current Price' },
  { key: 'cost', label: 'Purchase Cost' },
  { key: 'platform', label: 'Marketplace' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'listingAgeDays', label: 'Days Listed' },
  { key: 'category', label: 'Category' },
] as const;
const alias: Record<string, string[]> = { title:['title','item','name'], price:['price','sold','ask'], cost:['cost','bought'], platform:['platform','marketplace'], quantity:['qty','quantity'], listingAgeDays:['days','age'], category:['category','type'] };

const num = (v: unknown, d:number)=>{const n=Number(String(v??'').replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:d;};
const find=(cols:string[], a:string[])=>{const l=cols.map(c=>[c,c.toLowerCase()] as const); for(const x of a){const hit=l.find(([,v])=>v===x||v.includes(x)); if(hit) return hit[0];} return '';};
const parse=(t:string)=>{const lines=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); if(!lines.length) return []; const d=lines[0].includes('\t')?'\t':','; const h=lines[0].split(d).map(x=>x.trim()); return lines.slice(1).map(line=>{const p=line.split(d); const r:RawRow={}; h.forEach((k,i)=>r[k||`col_${i}`]=p[i]??''); return r;});};

function toInput(r: RawRow, m: Record<string,string>): ListingInput { const age=num(r[m.listingAgeDays],35); const price=num(r[m.price],0); const cost=num(r[m.cost],Math.max(1,price*.35)); return { title:String(r[m.title]??'Untitled item'), brand:'', category:String(r[m.category]??'General'), condition:'Used', size:'OS', color:'', material:'', purchaseCost:cost, targetSalePrice:Math.max(1, price||cost*1.8), shippingPaid:0, shippingCharged:0, platform:String(r[m.platform]??'eBay'), listingAgeDays:Math.max(0,age), notes:'Imported from intake.', safetyDocs:false, gradingDescriptors:false, impressions:400, clicks:4, salesCount:0, daysSinceEngagement:Math.min(45,Math.max(1,Math.round(age/2))), daysSinceSale:Math.min(60,Math.max(3,Math.round(age*.7))), impressionTrend7d:-30, adPerformanceDecline:35, pricingCompetitiveness:60, itemSpecificsCompleteness:55, titleOptimization:55, imageQuality:55 } }

export default function InventoryPage() {
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [map, setMap] = useState<Record<string,string>>({title:'',price:'',cost:'',platform:'',quantity:'',listingAgeDays:'',category:''});
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('Upload spreadsheets, screenshots, item photos, or pasted text. Messy inventory is okay.');

  const can = map.title && (map.price || map.cost) && rawRows.length;
  const rows = useMemo(()=> can ? rawRows.map(r=>({item:toInput(r,map), analysis: analyzeListing(toInput(r,map))})) : [], [can, rawRows, map]);
  const stale = rows.filter(r=>r.item.listingAgeDays>60).length;
  const profit = rows.reduce((s,r)=>s+r.item.targetSalePrice,0);
  const need = rows.filter(r=>r.analysis.deadListingRisk.recoveryPriority>=60).length;
  const health = rows.length? Math.round(rows.reduce((s,r)=>s+r.analysis.deadListingRisk.listingHealthScore,0)/rows.length):0;

  const hydrate=(r:RawRow[])=>{const c=Object.keys(r[0]??{}); setRawRows(r); setCols(c); const m: Record<string,string> = {title:'',price:'',cost:'',platform:'',quantity:'',listingAgeDays:'',category:''}; Object.keys(m).forEach(k=>m[k]=find(c,alias[k])); setMap(m); setMsg("We found possible inventory data. Let's confirm the fields.");};
  const onFile=async(f?:File)=>{if(!f)return; try{const parsed=parse(await f.text()); parsed.length?hydrate(parsed):setMsg('We found inventory data but need help matching a few fields.');}catch{setMsg('We found inventory data but need help matching a few fields.')}};

  return <section className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <K label="Stale Listings" value={`${stale}`} /><K label="Recoverable Profit" value={`$${profit.toFixed(0)}`} /><K label="Listings Needing Action" value={`${need}`} /><K label="Inventory Health" value={`${health}/100`} />
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-[#1f2533] bg-[#0f141d] p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Fix These First</h2><span className="text-xs text-[#9ca6b8]">{rows.length} listings</span></div>
        <div className="space-y-2">{rows.slice(0,8).map(({item,analysis})=><div key={item.title} className="rounded-md border border-[#232b3b] bg-[#111823] p-3"><div className="flex items-start gap-3"><div className="h-10 w-10 rounded bg-[#1a2230]" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-[#9ca6b8]">{item.platform} · Listed {item.listingAgeDays} days</p><p className="mt-1 text-xs">Issue: {analysis.deadListingRisk.topIssue}</p><p className="text-xs">Recovery Opportunity: +${(item.targetSalePrice*0.18).toFixed(0)}</p><p className="text-xs">Action Needed: {analysis.deadListingRisk.recommendedAction}</p></div><button className="rounded-md border border-[#2c3548] px-2 py-1 text-xs">View Action</button></div></div>)}</div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-[#1f2533] bg-[#0f141d] p-4"><p className="text-sm font-semibold">Upload Inventory</p><p className="mt-1 text-xs text-[#9ca6b8]">Messy inventory is okay.</p><label className="mt-3 block rounded-md border border-dashed border-[#2a3243] bg-[#121a26] p-3 text-xs">Upload Spreadsheet, Screenshot, or Item Photos<input className="mt-2" type="file" accept=".csv,.xlsx,.xls,image/*" onChange={(e)=>onFile(e.target.files?.[0])} /></label><textarea className="mt-2" rows={3} value={text} onChange={(e)=>setText(e.target.value)} placeholder="Paste inventory text" /><button className="mt-2 w-full bg-[#c8ad7f] text-[#0b0e14]" onClick={()=>{const lines=text.split('\n').map(t=>t.trim()).filter(Boolean); if(lines.length) hydrate(lines.map(title=>({title})));}}>Detect from text</button><p className="mt-2 text-xs text-[#9ca6b8]">{msg}</p></div>
        {cols.length? <div className="rounded-xl border border-[#1f2533] bg-[#0f141d] p-4"><p className="text-sm font-semibold">Confirm detected fields</p><div className="mt-2 grid gap-2">{fields.map(f=><label key={f.key} className="text-xs text-[#aeb6c5]">{f.label}<select value={map[f.key]} onChange={(e)=>setMap(m=>({...m,[f.key]:e.target.value}))}><option value="">Not sure yet</option>{cols.map(c=><option key={c} value={c}>{c}</option>)}</select></label>)}</div></div>:null}
      </div>
    </div>
  </section>;
}

function K({label,value}:{label:string;value:string}){return <div className="rounded-md border border-[#1f2533] bg-[#0f141d] p-3"><p className="text-[11px] text-[#9ca6b8]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>}
