const analyses = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));
  const total = analyses.length || 1;
  const highRisk = analyses.filter((row) => row.analysis.deadListingRisk.riskLevel === 'High').length;
  const deadAlerts = analyses.filter((row) => row.analysis.deadListingRisk.riskScore >= 60).length;
  const recoverableRevenue = analyses.reduce((sum: number, row) => sum + row.item.targetSalePrice, 0);
  const profitLeaks = analyses.reduce((sum: number, row) => sum + (row.item.listingAgeDays > 60 ? row.item.targetSalePrice * 0.15 : 0), 0);
  const recoveryScore = Math.round(
  const urgent = [...analyses].sort((a, b) => b.analysis.deadListingRisk.riskScore - a.analysis.deadListingRisk.riskScore).slice(0, 3);

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-[36px] border border-[#29204E] bg-[#070A18] text-white shadow-2xl">
        <div className="grid gap-10 p-7 md:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
    <section className="space-y-12">
      <div className="overflow-hidden rounded-[34px] border border-[#1C2440] bg-[#070A18] text-white shadow-2xl">
        <div className="grid gap-10 p-7 md:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:p-14">
          <div className="flex flex-col justify-center">
            <div className="w-fit rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#D5CAFF]">
              Inventory Intelligence for Resellers
            </div>
            <p className="w-fit rounded-full border border-[#7AF59A]/25 bg-[#7AF59A]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">
              Inventory Intelligence
            </p>
            <h1 className="mt-7 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
              Your Inventory
              <br />
              Is Leaking
              <br />
              <span className="text-[#8B5CFF]">Money.</span>
              Your Inventory Is Leaking Money.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              Recover money sitting in unsold inventory. Spot stale stock, weak margins, and trapped capital before sourcing more.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="/inventory" className="rounded-2xl bg-[#7C5CFF] px-6 py-3 font-bold text-white shadow-lg shadow-[#7C5CFF]/25">
                Recover Inventory
              <a href="/inventory" className="rounded-2xl bg-[#7AF59A] px-6 py-3 font-extrabold text-[#070A18] shadow-lg shadow-[#7AF59A]/20">
                Start Recovery
              </a>
              <a href="/analyze" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white">
                Run Decision Check
                Decision Engine
              </a>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#11172E] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Recovery Operations</p>
                <p className="text-xs text-slate-400">Sample inventory health</p>
              </div>
              <div className="rounded-full bg-[#7AF59A]/15 px-3 py-1 text-xs font-bold text-[#7AF59A]">Score {recoveryScore}/100</div>
          <div className="rounded-[28px] border border-white/10 bg-[#11172E] p-5 shadow-2xl">
            <div className="rounded-3xl border border-[#7AF59A]/20 bg-[#7AF59A]/10 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7AF59A]">Recoverable Inventory Value</p>
              <p className="mt-3 text-6xl font-black tracking-tight text-[#7AF59A]">${recoverableRevenue.toFixed(0)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Trapped Capital</p>
                <p className="mt-3 text-3xl font-extrabold text-[#7AF59A]">${recoverableRevenue.toFixed(0)}</p>
              </div>
              <div className="rounded-3xl bg-[#1A223F] p-4">
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Profit Leak</p>
                <p className="mt-3 text-3xl font-extrabold text-[#C59BFF]">${profitLeaks.toFixed(0)}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#C59BFF]">${profitLeaks.toFixed(0)}</p>
              </div>
              <div className="rounded-3xl bg-[#1A223F] p-4">
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">High Risk</p>
                <p className="mt-3 text-3xl font-extrabold text-[#FF8A8A]">{highRisk}</p>
              </div>
              <div className="rounded-3xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Dead Alerts</p>
                <p className="mt-3 text-3xl font-extrabold text-[#FFD36B]">{deadAlerts}</p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-[#1A223F] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Recovery Score</span>
                <span>{recoveryScore}/100</span>
                <p className="mt-2 text-2xl font-extrabold text-[#FF8A8A]">{highRisk}</p>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#7C5CFF]" style={{ width: `${Math.max(5, Math.min(100, recoveryScore))}%` }} />
              <div className="rounded-2xl bg-[#1A223F] p-4">
                <p className="text-xs text-slate-400">Health</p>
                <p className="mt-2 text-2xl font-extrabold text-[#FFD36B]">{recoveryScore}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Dead Inventory Recovery</p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Know what to fix first.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Priority labels turn stale stock into a short recovery queue.</p>
        </div>
        <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Margin Protection</p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Stop selling at fake profit.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Fees, shipping, and stale risk expose where margin is leaking.</p>
        </div>
        <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Recovery Loop</p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Fix inventory before sourcing.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Focus on trapped money already sitting on your shelf.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Immediate Recovery Queue</p>
            <h3 className="mt-1 text-2xl font-bold text-ink">Fix these before listing anything new</h3>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">What should you fix next?</h2>
          </div>
          <a href="/dead-listings" className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">Open Recovery Room</a>
        </div>
        <div className="mt-5 grid gap-3">
          {urgent.map(({ item, analysis }) => (
            <div key={item.title} className="rounded-2xl border border-tan/80 bg-ivory p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.platform} • {item.listingAgeDays} days • ${item.targetSalePrice.toFixed(0)}</p>
                  <p className="mt-2 text-sm text-slate-700">Issue: {analysis.deadListingRisk.topIssue}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{item.platform} / {item.listingAgeDays} days / ${item.targetSalePrice.toFixed(0)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                  <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-white">{analysis.deadListingRisk.recommendedAction}</span>
                </div>
                <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-white">{analysis.deadListingRisk.recommendedAction}</span>
              </div>
            </div>
          ))}
