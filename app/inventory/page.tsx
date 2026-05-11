'use client';
import { useMemo, useState } from 'react';
import { analyzeListing } from '@/lib/listingGenerator';
import { ListingInput } from '@/lib/types';

type RawRow = Record<string, unknown>;
const fields = [{key:'title',label:'Item Title'},{key:'price',label:'Current Price'},{key:'cost',label:'Purchase Cost'},{key:'platform',label:'Marketplace'},{key:'listingAgeDays',label:'Days Listed'},{key:'category',label:'Category'}] as const;
const alias: Record<string,string[]> = { title:['title','item','name'], price:['price','sold'], cost:['cost','bought'], platform:['platform','marketplace'], listingAgeDays:['days','age'], category:['category','type'] };
const n=(v:unknown,d:number)=>{const x=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(x)?x:d};
const find=(c:string[],a:string[])=>{for(const t of a){const f=c.find(x=>x.toLowerCase().includes(t)); if(f)return f;}return ''};
const parse=(t:string)=>{const l=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!l.length)return[];const d=l[0].includes('\t')?'\t':',';const h=l[0].split(d).map(x=>x.trim());return l.slice(1).map(line=>{const p=line.split(d);const r:RawRow={};h.forEach((k,i)=>r[k||`c${i}`]=p[i]??'');return r;});};
const toInput=(r:RawRow,m:Record<string,string>):ListingInput=>{const age=n(r[m.listingAgeDays],40),price=n(r[m.price],0),cost=n(r[m.cost],Math.max(1,price*.35));return {title:String(r[m.title]??'Untitled item'),brand:'',category:String(r[m.category]??'General'),condition:'Used',size:'OS',color:'',material:'',purchaseCost:cost,targetSalePrice:Math.max(1,price||cost*1.8),shippingPaid:0,shippingCharged:0,platform:String(r[m.platform]??'eBay'),listingAgeDays:Math.max(0,age),notes:'Imported',safetyDocs:false,gradingDescriptors:false,impressions:400,clicks:4,salesCount:0,daysSinceEngagement:20,daysSinceSale:35,impressionTrend7d:-30,adPerformanceDecline:35,pricingCompetitiveness:60,itemSpecificsCompleteness:55,titleOptimization:55,imageQuality:55};};

export default function InventoryPage(){
  const [rawRows,setRawRows]=useState<RawRow[]>([]); const [cols,setCols]=useState<string[]>([]); const [map,setMap]=useState<Record<string,string>>({title:'',price:'',cost:'',platform:'',listingAgeDays:'',category:''}); const [text,setText]=useState(''); const [msg,setMsg]=useState('Messy inventory is okay.');
  const can = map.title && (map.price || map.cost) && rawRows.length;
  const rows = useMemo(()=> can ? rawRows.map(r=>({item:toInput(r,map),analysis:analyzeListing(toInput(r,map))})):[],[can,rawRows,map]);
  const kpi=[['Stale Listings',`${rows.filter(r=>r.item.listingAgeDays>60).length}`],['Est. Recoverable Profit',`$${rows.reduce((s,r)=>s+r.item.targetSalePrice*.18,0).toFixed(0)}`],['Listings Needing Action',`${rows.filter(r=>r.analysis.deadListingRisk.recoveryPriority>60).length}`],['Inventory Health',`${rows.length?Math.round(rows.reduce((s,r)=>s+r.analysis.deadListingRisk.listingHealthScore,0)/rows.length):0}%`]];

  const hydrate=(r:RawRow[])=>{const c=Object.keys(r[0]??{});setRawRows(r);setCols(c);const m:Record<string,string>={title:'',price:'',cost:'',platform:'',listingAgeDays:'',category:''};Object.keys(m).forEach(k=>m[k]=find(c,alias[k]));setMap(m);setMsg("We found possible inventory data. Let’s confirm the fields.");};
  const onFile=async(f?:File)=>{if(!f)return;try{const p=parse(await f.text());p.length?hydrate(p):setMsg('We found inventory data but need help matching a few fields.');}catch{setMsg('We found inventory data but need help matching a few fields.');}};

  return <section className="space-y-4">
    <div className="grid gap-3 md:grid-cols-4">{kpi.map(([l,v])=><div key={l} className="rounded-lg border border-[#24314b] bg-[#0d1524] p-3"><p className="text-xs text-[#8fa0ba]">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.65fr_0.75fr]">
      <div className="rounded-lg border border-[#24314b] bg-[#0d1524] p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Fix These First</h2><p className="text-sm text-[#8fa0ba]">Top opportunities to recover profit</p></div></div>
        <div className="space-y-2">{rows.slice(0,6).map(({item,analysis})=><div key={item.title} className="grid grid-cols-[56px_1.2fr_0.7fr_1fr_auto] items-center gap-3 rounded-md border border-[#24314b] bg-[#0f1828] p-3"><div className="h-14 w-14 rounded-md bg-[#1b2538]"/><div><p className="font-semibold">{item.title}</p><p className="text-xs text-[#8fa0ba]">{item.platform} · Listed {item.listingAgeDays} days</p></div><p className="text-sm">Issue: {analysis.deadListingRisk.topIssue}</p><div><p className="text-sm text-[#71d69e]">+${(item.targetSalePrice*.18).toFixed(0)} Potential Profit</p><p className="text-sm">Action: {analysis.deadListingRisk.recommendedAction}</p></div><button className="border border-[#c8ad7f] text-[#e6c98f]">View Action</button></div>)}</div>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-[#24314b] bg-[#0d1524] p-4"><h3 className="text-xl font-semibold">Upload Inventory</h3><p className="text-sm text-[#8fa0ba]">Upload Spreadsheet, Screenshot, or Item Photos</p><p className="text-sm text-[#8fa0ba]">Messy inventory is okay.</p><label className="mt-3 block rounded-md border border-dashed border-[#2b3852] bg-[#111b2d] p-3 text-sm">Upload Files<input className="mt-2" type="file" accept=".csv,.xlsx,.xls,image/*" onChange={(e)=>onFile(e.target.files?.[0])}/></label><p className="my-2 text-center text-xs text-[#8fa0ba]">or</p><textarea rows={3} value={text} onChange={(e)=>setText(e.target.value)} placeholder="Paste inventory text" /><button className="mt-2 w-full border border-[#2b3852]" onClick={()=>{const lines=text.split('\n').map(x=>x.trim()).filter(Boolean); if(lines.length)hydrate(lines.map(title=>({title})));}}>Paste Inventory Text</button><p className="mt-2 text-xs text-[#8fa0ba]">{msg}</p></div>
        {cols.length?<div className="rounded-lg border border-[#24314b] bg-[#0d1524] p-4"><h4 className="text-sm font-semibold">Confirm detected fields</h4><div className="mt-2 space-y-2">{fields.map(f=><label key={f.key} className="text-xs text-[#9eacc3]">{f.label}<select value={map[f.key]} onChange={(e)=>setMap(m=>({...m,[f.key]:e.target.value}))}><option value="">Not sure yet</option>{cols.map(c=><option key={c} value={c}>{c}</option>)}</select></label>)}</div></div>:null}
      </div>
    </div>
  </section>
}
