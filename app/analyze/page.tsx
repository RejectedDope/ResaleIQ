import { useState } from 'react';
import { ScoreCard } from '@/components/ScoreCard';
import { RiskBadge } from '@/components/RiskBadge';
import { analyzeListing } from '@/lib/listingGenerator';
import { ListingAnalysis, ListingInput } from '@/lib/types';

  const bullets = analysis ? analysis.fixRecommendations.slice(0, 4) : [];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">Decision Engine</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Inventory Recovery Check</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
          Enter the item, money, and timing signals. Get the next move, exact price, title fix, and one clear reason.
        </p>
    <section className="space-y-8">
      <div className="rounded-[28px] border border-[#1C2440] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">Decision Engine</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Fix, hold, reprice, or liquidate.</h1>
          </div>
          <button form="decision-engine-form" className="bg-[#7AF59A] px-6 py-4 text-[#070A18]" type="submit">Get Next Move</button>
        </div>
      </div>

      <form
        id="decision-engine-form"
        onSubmit={(e) => {
          e.preventDefault();
          setAnalysis(analyzeListing(form));
          <div className="mt-4 space-y-3">
            <label className="text-sm font-bold text-slate-700">Days live<input type="number" min={0} step="1" value={form.listingAgeDays} onChange={(e) => update('listingAgeDays', Number(e.target.value))} /></label>
            <label className="text-sm font-bold text-slate-700">Optional notes<textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Slow watchers, weak photos, stains, offers..." /></label>
            <button className="w-full bg-[#070A18] py-4 text-white" type="submit">Run Recovery Check</button>
            <button className="w-full bg-[#070A18] py-4 text-white" type="submit">Get Next Move</button>
          </div>
        </div>
      </form>

      {analysis ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <ScoreCard title="Decision" value={decision} helper={analysis.deadListingRisk.recommendedAction} tone={decisionTone(decision)} />
            <ScoreCard title="Recommended Price" value={`$${analysis.recommendedListingPrice.toFixed(0)}`} helper={`Fast exit: $${analysis.fastSalePrice.toFixed(0)}`} tone="success" />
            <ScoreCard title="Profit Lift" value={`+$${lift.toFixed(0)}`} helper="Estimated upside from action." tone={lift > 0 ? 'success' : 'neutral'} />
            <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Stale Risk</p>
              <p className="mt-3 text-3xl font-extrabold">{analysis.deadListingRisk.riskScore}</p>
              <RiskBadge level={analysis.deadListingRisk.riskLevel} />
          <div className="rounded-[28px] border border-[#1C2440] bg-[#070A18] p-6 text-white shadow-xl">
            <div className="grid gap-5 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Next Move</p>
                <p className="mt-2 text-5xl font-black tracking-tight">{decision}</p>
                <p className="mt-2 text-sm font-bold text-slate-300">{reason}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Recommended Price</p>
                <p className="mt-2 text-3xl font-black text-[#7AF59A]">${analysis.recommendedListingPrice.toFixed(0)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Profit Lift</p>
                <p className="mt-2 text-3xl font-black text-[#7AF59A]">+${lift.toFixed(0)}</p>
              </div>
            </div>
          </div>


          <details className="rounded-2xl border border-tan bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-extrabold uppercase tracking-[0.16em] text-slate-600">View Details</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <ScoreCard title="Stale Risk" value={analysis.deadListingRisk.riskScore} tone={decisionTone(decision)} />
              <ScoreCard title="Compliance" value={analysis.complianceScore} />
              <ScoreCard title="Profit" value={analysis.profitScore} />
              <ScoreCard title="Visibility" value={analysis.visibilityScore} />
