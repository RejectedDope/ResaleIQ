const activeRows = prioritized.filter((row) => row.item.status === 'active');
  const pendingRows = prioritized.filter((row) => row.item.status === 'pending');
  const completedRows = prioritized.filter((row) => row.item.status === 'completed');
  const topItems = activeRows.slice(0, 5);
  const topItems = activeRows.slice(0, 3);
  const recoverableRows = activeRows.concat(pendingRows).filter((row) => !isNotWorthFixing(row));
  const totalRecoverable = recoverableRows.reduce((sum: number, row) => sum + Number(row.fixed.improvement), 0);
  const potentialRecovered = completedRows.reduce((sum: number, row) => sum + Number(row.fixed.improvement), 0);
  const pendingPotential = pendingRows.reduce((sum: number, row) => sum + Number(row.fixed.improvement), 0);
  const averageRoi = Math.round(prioritized.reduce((sum: number, row) => sum + Number(row.current.roi), 0) / Math.max(prioritized.length, 1));
  const itemSummary = {
    total: items.length,
  };

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#29204E] bg-[#070A18] p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <section className="space-y-12">
      <div className="overflow-hidden rounded-[28px] border border-[#1C2440] bg-[#070A18] text-white shadow-2xl">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">Inventory Intelligence</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Recover Money Sitting in Unsold Inventory</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              Dead stock, weak ROI, and trapped capital ranked by what to fix first.
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7AF59A]">Inventory Command Center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Dead Inventory Recovery Engine</h1>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{activeRows.length} need action</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{pendingRows.length} pending</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">{completedRows.length} fixed</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5 text-[#7AF59A]">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Trapped capital</p>
            <p className="mt-2 text-5xl font-black">${totalRecoverable.toFixed(0)}</p>
            <p className="mt-2 text-sm font-bold text-slate-200">From {activeRows.length + pendingRows.length} open items</p>
          <div className="min-w-full rounded-3xl border border-[#7AF59A]/25 bg-[#7AF59A]/10 p-5 text-[#7AF59A] md:min-w-[340px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Recoverable Inventory Value</p>
            <p className="mt-2 text-6xl font-black tracking-tight">${totalRecoverable.toFixed(0)}</p>
            <button type="button" onClick={runAnalysis} disabled={!canAnalyzeItems} className="mt-5 w-full bg-[#7AF59A] py-4 text-base font-extrabold text-[#070A18] disabled:opacity-40">
              {canAnalyzeItems ? 'Start Recovery' : 'Add titles and prices'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard title="Recoverable Money" value={`$${totalRecoverable.toFixed(0)}`} helper="Active recovery upside." tone="dark" />
        <ScoreCard title="Fix Queue" value={activeRows.length} helper="Sorted by risk and lift." tone={activeRows.length ? 'danger' : 'success'} />
        <ScoreCard title="Session Progress" value={`${completedRows.length}/${Math.max(prioritized.length, 1)}`} helper="Completed fixes from this batch." tone={completedRows.length ? 'success' : 'neutral'} />
        <ScoreCard title="Pending Fixes" value={pendingRows.length} helper="Chosen fixes not applied yet." tone={pendingRows.length ? 'warning' : 'success'} />
      </div>
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><p className="text-sm font-extrabold">{message}</p></div> : null}
      {warnings.length ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Needs attention</p><ul className="mt-2 space-y-1 text-sm font-bold text-slate-700">{warnings.map((warning) => <li key={warning}>- {warning}</li>)}</ul></div> : null}

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Recovery Queue</p>
            <h2 className="mt-1 text-3xl font-extrabold text-ink">Today's Fix List</h2>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Today&apos;s Fixes</p>
            <h2 className="mt-1 text-3xl font-extrabold text-ink">Fix these first</h2>
          </div>
          <button type="button" onClick={runAnalysis} disabled={!canAnalyzeItems} className="bg-[#070A18] px-6 py-4 text-base font-extrabold text-white hover:bg-[#2B185F] disabled:opacity-40">
            {canAnalyzeItems ? 'Run Recovery Analysis' : 'Add titles and prices first'}
          </button>
          <p className="text-sm font-bold text-slate-500">Top {topItems.length || 0} by profit lift and stale risk</p>
        </div>

        <div className="mt-5 grid gap-4">
        <div className="grid gap-3">
          {topItems.length ? topItems.map((row, index) => {
            const { item, input, analysis, current, fixed, band } = row;
            const reasons = recommendationReasons(row);
            const urgency = urgencyLabel(row);
            const skipItem = isNotWorthFixing(row);
            return (
              <div key={item.id} className={`rounded-2xl border p-5 ${priorityCardClass(row)}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    {item.photoUrl ? <img src={item.photoUrl} alt="Inventory upload" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{sourceLabel(item.source)}</div>}
              <div key={item.id} className={`rounded-2xl border p-4 shadow-sm ${priorityCardClass(row)}`}>
                <div className="grid gap-4 lg:grid-cols-[1.1fr_1.25fr_auto] lg:items-center">
                  <div className="flex gap-3">
                    {item.photoUrl ? <img src={item.photoUrl} alt="Inventory upload" className="h-16 w-16 rounded-xl object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{sourceLabel(item.source)}</div>}
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] ${urgencyClass(urgency)}`}>{urgency}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-600">Fix {index + 1}</span>
                      </div>
                      <h3 className="mt-2 truncate text-lg font-extrabold text-ink">{item.title}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{item.platform} / {input.listingAgeDays} days stale</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sage">Fix {index + 1}</p>
                      <h3 className="mt-2 text-xl font-extrabold text-ink">{item.title}</h3>
                      <p className="mt-2 text-sm font-bold text-slate-600">{item.platform} - ROI {current.roi}% - risk {analysis.deadListingRisk.riskScore}</p>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Issue</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{reasons[0]}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Exact Fix</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">${current.price.toFixed(0)} to ${fixed.price.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Lift</p>
                      <p className="mt-1 text-2xl font-black text-[#0F7A3F]">+${fixed.improvement.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] ${urgencyClass(urgency)}`}>{urgency}</span>
                    <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                    <span className="rounded-full bg-[#070A18] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white">Fix Now: {analysis.deadListingRisk.recommendedAction}</span>

                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
                    <button type="button" onClick={() => skipItem ? (updateStatus(item.id, 'pending'), setMessage('Low-return item moved aside.')) : setConfirmingItemId(item.id)} className={skipItem ? 'bg-slate-300 text-slate-800' : 'bg-[#7AF59A] text-[#070A18]'}>
                      {skipItem ? 'Move Aside' : 'Apply Fix'}
                    </button>
                    <button type="button" onClick={() => copyText(optimizedTitle(input))} className="bg-white text-ink">Copy Title</button>
                    <button type="button" onClick={() => copyText(reasons.join('\n'))} className="bg-white text-ink">Copy Bullets</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[0.85fr_0.85fr_1.2fr_auto]">
                  <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current</p><p className="mt-2 text-sm font-bold text-slate-700">Price ${current.price.toFixed(0)}</p><p className="mt-1 text-sm font-bold text-slate-700">ROI {current.roi}%</p></div>
                  <div className="rounded-2xl bg-[#070A18] p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AF59A]">After Fix</p><p className="mt-2 text-sm font-bold">New price ${fixed.price.toFixed(0)}</p><p className="mt-1 text-xl font-extrabold text-[#7AF59A]">+${fixed.improvement.toFixed(0)} profit</p><div className="mt-3 space-y-1 text-sm font-semibold leading-5 text-slate-200">{reasons.map((reason) => <p key={reason}>{reason}</p>)}</div></div>
                  <div className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{skipItem ? 'Skip this' : 'Apply this'}</p><p className="mt-2">{skipItem ? 'Do not spend time here until better items are handled.' : `Title: ${optimizedTitle(input)}`}</p><p>{skipItem ? 'Liquidate, bundle, or leave it alone.' : `Price $${fixed.price.toFixed(0)}`}</p></div>
                  <div className="flex flex-col gap-2 lg:min-w-[150px]"><button type="button" onClick={() => skipItem ? (updateStatus(item.id, 'pending'), setMessage('Skipped low-return item so you can focus on better profit.')) : setConfirmingItemId(item.id)} className={skipItem ? 'bg-slate-300 text-slate-800' : 'bg-[#7AF59A] text-[#070A18]'}>{skipItem ? 'Skip for Now' : 'Mark as Fixed'}</button><button type="button" onClick={() => copyText(optimizedTitle(input))} className="bg-white text-ink">Copy Title</button><button type="button" onClick={() => copyText(reasons.join('\n'))} className="bg-white text-ink">Copy Bullets</button></div>
                </div>

                <details className="mt-3 rounded-2xl border border-tan/70 bg-white p-4">
                  <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-[0.16em] text-slate-600">View Details</summary>
                  <div className="mt-3 grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-3">
                    <p>Price range ${band.low.toFixed(0)}-${band.high.toFixed(0)}</p>
                <details className="mt-3 rounded-xl border border-tan/70 bg-white/80 p-3">
                  <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600">View Details</summary>
                  <div className="mt-3 grid gap-3 text-sm font-bold text-slate-700 md:grid-cols-4">
                    <p>Title: {optimizedTitle(input)}</p>
                    <p>Range ${band.low.toFixed(0)}-${band.high.toFixed(0)}</p>
                    <p>Action {analysis.deadListingRisk.recommendedAction}</p>
                    <p>Risk driver {analysis.deadListingRisk.topIssue}</p>
                    <div><RiskBadge level={analysis.deadListingRisk.riskLevel} /></div>
                  </div>
                </details>

                {confirmingItemId === item.id ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-extrabold text-ink">Did you apply this fix?</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => completeAppliedFix(row)} className="bg-[#070A18] text-white">Yes</button><button type="button" onClick={() => { updateStatus(item.id, 'pending'); setConfirmingItemId(null); setMessage('Saved to Pending Fixes.'); }} className="bg-white text-ink">Not yet</button></div></div> : null}
                {confirmingItemId === item.id ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-extrabold text-ink">Did you apply this fix?</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => completeAppliedFix(row)} className="bg-[#070A18] text-white">Yes</button><button type="button" onClick={() => { updateStatus(item.id, 'pending'); setConfirmingItemId(null); setMessage('Saved to Pending Fixes.'); }} className="bg-white text-ink">Not yet</button></div></div> : null}
              </div>
            );
          }) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">No active fixes</p><h3 className="mt-2 text-2xl font-extrabold">Your fix list is clear.</h3><p className="mt-2 text-sm font-bold text-emerald-800">Add priced inventory or move pending fixes back to active.</p></div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="text-2xl font-extrabold text-ink">No inventory analyzed yet.</h3><p className="mt-2 text-sm font-bold text-slate-500">Upload inventory to begin recovery analysis.</p></div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard title="Items Needing Action" value={activeRows.length} tone={activeRows.length ? 'danger' : 'success'} />
        <ScoreCard title="Session Progress" value={`${completedRows.length}/${Math.max(prioritized.length, 1)}`} tone={completedRows.length ? 'success' : 'neutral'} />
        <ScoreCard title="Potential Recovered" value={`$${potentialRecovered.toFixed(0)}`} tone={potentialRecovered ? 'success' : 'neutral'} />
      </div>

      {changeSummary ? <div className="grid gap-3 md:grid-cols-4"><ScoreCard title="Improved" value={changeSummary.improved} tone="success" /><ScoreCard title="Still At Risk" value={changeSummary.stillAtRisk} tone={changeSummary.stillAtRisk ? 'warning' : 'success'} /><ScoreCard title="Worse" value={changeSummary.worse} tone={changeSummary.worse ? 'danger' : 'success'} /><ScoreCard title="Price Changes" value={changeSummary.priceChanges} tone="dark" /></div> : null}

      <details className="rounded-2xl border border-tan bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-extrabold uppercase tracking-[0.16em] text-slate-600">Expanded Inventory ({items.length})</summary>
        <div className="mt-5 grid gap-3 md:grid-cols-4"><ScoreCard title="Total Items" value={itemSummary.total} tone="dark" /><ScoreCard title="Needs Title" value={itemSummary.missingTitles} tone={itemSummary.missingTitles ? 'warning' : 'success'} /><ScoreCard title="Needs Price" value={itemSummary.priceProblems} tone={itemSummary.priceProblems ? 'warning' : 'success'} /><ScoreCard title="Average ROI" value={`${averageRoi}%`} tone={averageRoi < 50 ? 'warning' : 'success'} /></div>
        <div className="mt-5 space-y-2">
          {items.length ? items.map((item, index) => {
            const row = rowById.get(item.id);
            const missingTitle = !item.title.trim();
            const priceProblem = item.price <= 0;
            return <div key={item.id} className={`grid gap-3 rounded-xl border p-3 lg:grid-cols-[56px_1.4fr_0.55fr_0.55fr_0.65fr_0.65fr_auto] ${missingTitle || priceProblem ? 'border-amber-200 bg-amber-50' : 'border-tan/80 bg-ivory'}`}><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{item.photoUrl ? <img src={item.photoUrl} alt="Inventory upload" className="h-full w-full object-cover" /> : sourceLabel(item.source)}</div><label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Title<input value={item.title} onChange={(event) => updateItem(item.id, 'title', event.target.value)} placeholder={`Item ${index + 1} title`} />{missingTitle ? <span className="mt-1 block text-xs text-amber-700">Add title</span> : null}</label><label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Price<input type="number" min={0} step="0.01" value={item.price} onChange={(event) => updateItem(item.id, 'price', Number(event.target.value))} />{priceProblem ? <span className="mt-1 block text-xs text-amber-700">Add price</span> : null}</label><label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Cost<input type="number" min={0} step="0.01" value={item.cost} onChange={(event) => updateItem(item.id, 'cost', Number(event.target.value))} /></label><label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Platform<input value={item.platform} onChange={(event) => updateItem(item.id, 'platform', event.target.value)} /></label><div className="flex flex-col justify-end gap-1"><span className={`w-fit rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${statusClass(item.status)}`}>{item.status}</span><span className="text-xs font-extrabold text-slate-600">ROI {row && !missingTitle && !priceProblem ? `${row.current.roi}%` : '--'}</span></div><button type="button" onClick={() => removeItem(item.id)} className="self-end bg-white text-red-700">Remove</button></div>;
          }) : <div className="rounded-2xl border border-dashed border-tan bg-ivory p-8 text-center"><p className="text-xl font-extrabold text-ink">No inventory analyzed yet.</p><p className="mt-2 text-sm font-bold text-slate-600">Upload inventory to begin recovery analysis.</p></div>}
        </div>
      </details>

      {pendingRows.length ? <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Pending Fixes</p><div className="mt-3 grid gap-3 md:grid-cols-2">{pendingRows.map((row) => <div key={row.item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-ink"><p className="truncate text-sm font-extrabold">{row.item.title}</p><p className="mt-1 text-sm font-bold text-slate-700">${row.fixed.improvement.toFixed(0)} pending potential</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => completeAppliedFix(row)} className="bg-[#070A18] text-white">Applied Now</button><button type="button" onClick={() => updateStatus(row.item.id, 'active')} className="bg-white text-ink">Move to Active</button></div></div>)}</div></div> : null}
      {completedRows.length ? <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Completed</p><div className="mt-3 grid gap-3 md:grid-cols-2">{completedRows.map((row) => <div key={row.item.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950"><p className="truncate text-sm font-extrabold">Done: {row.item.title}</p><p className="mt-1 text-sm font-bold text-emerald-800">${row.fixed.improvement.toFixed(0)} potential recovered</p><button type="button" onClick={() => updateStatus(row.item.id, 'active')} className="mt-3 bg-white text-ink">Move to Active</button></div>)}</div></div> : null}

      <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Add Inventory</p><h2 className="mt-1 text-2xl font-extrabold text-ink">Upload inventory, then run recovery</h2></div>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={addManualItem} disabled={items.length >= MAX_IMPORT_ROWS} className="bg-ivory text-ink disabled:opacity-40">Add Item Manually</button><button type="button" onClick={startFresh} className="bg-white text-red-700">Start Fresh</button>{!items.length ? <button type="button" onClick={() => appendItems(STARTER_ITEMS, 'Sample inventory restored.')} className="bg-ivory text-ink">Load Samples</button> : null}</div>
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">Upload / Add Inventory</p><h2 className="mt-1 text-2xl font-extrabold text-ink">Add inventory when you are ready</h2></div>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={addManualItem} disabled={items.length >= MAX_IMPORT_ROWS} className="bg-ivory text-ink disabled:opacity-40">Add Item</button><button type="button" onClick={startFresh} className="bg-white text-red-700">Start Fresh</button>{!items.length ? <button type="button" onClick={() => appendItems(STARTER_ITEMS, 'Sample inventory restored.')} className="bg-ivory text-ink">Load Samples</button> : null}</div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <label onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleDrop(event); }} className={`flex min-h-[150px] cursor-pointer flex-col justify-center rounded-2xl border-2 border-dashed p-5 transition ${isDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'}`}><span className="text-lg font-extrabold text-ink">Upload file</span><span className="mt-2 text-sm font-bold text-slate-600">Drop CSV or Excel. Rows add to the same inventory.</span><input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => handleFile(event.target.files?.[0])} /><span className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700">{isParsing ? 'Reading file...' : fileName ? `Loaded: ${fileName}` : 'CSV, XLSX, XLS'}</span></label>
          <label onDragOver={(event) => { event.preventDefault(); setIsPhotoDragging(true); }} onDragLeave={() => setIsPhotoDragging(false)} onDrop={handlePhotoDrop} className={`flex min-h-[150px] cursor-pointer flex-col justify-center rounded-2xl border-2 border-dashed p-5 transition ${isPhotoDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'}`}><span className="text-lg font-extrabold text-ink">Upload photos</span><span className="mt-2 text-sm font-bold text-slate-600">Add thumbnails, then quick titles and prices.</span><input className="hidden" type="file" accept="image/*" multiple onChange={(event) => handlePhotos(event.target.files)} /><span className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700">Multiple images supported</span></label>
          <div className="flex min-h-[150px] flex-col justify-center rounded-2xl border border-tan bg-ivory p-5"><span className="text-lg font-extrabold text-ink">Manual entry</span><span className="mt-2 text-sm font-bold text-slate-600">Add one-off items without a spreadsheet.</span><button type="button" onClick={addManualItem} disabled={items.length >= MAX_IMPORT_ROWS} className="mt-4 bg-[#070A18] text-white disabled:opacity-40">Add Manual Item</button></div>
          <label onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleDrop(event); }} className={`flex min-h-[126px] cursor-pointer flex-col justify-center rounded-2xl border-2 border-dashed p-5 transition ${isDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'}`}><span className="text-lg font-extrabold text-ink">Upload file</span><input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => handleFile(event.target.files?.[0])} /><span className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700">{isParsing ? 'Reading file...' : fileName ? `Loaded: ${fileName}` : 'CSV, XLSX, XLS'}</span></label>
          <label onDragOver={(event) => { event.preventDefault(); setIsPhotoDragging(true); }} onDragLeave={() => setIsPhotoDragging(false)} onDrop={handlePhotoDrop} className={`flex min-h-[126px] cursor-pointer flex-col justify-center rounded-2xl border-2 border-dashed p-5 transition ${isPhotoDragging ? 'border-[#7AF59A] bg-[#7AF59A]/10' : 'border-tan bg-ivory'}`}><span className="text-lg font-extrabold text-ink">Upload photos</span><input className="hidden" type="file" accept="image/*" multiple onChange={(event) => handlePhotos(event.target.files)} /><span className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700">Small batches</span></label>
          <div className="flex min-h-[126px] flex-col justify-center rounded-2xl border border-tan bg-ivory p-5"><span className="text-lg font-extrabold text-ink">Manual entry</span><button type="button" onClick={addManualItem} disabled={items.length >= MAX_IMPORT_ROWS} className="mt-3 bg-[#070A18] text-white disabled:opacity-40">Add Item</button></div>
        </div>

        {columns.length && parsedRows.length && !canAddDetectedRows ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Needs one adjustment</p><h3 className="mt-2 text-xl font-extrabold">We found rows, but the title or price data is missing.</h3></div><button type="button" onClick={() => setShowFieldEditor((value) => !value)} className="bg-white text-ink">Adjust Fields</button></div>{showFieldEditor ? <div className="mt-4 grid gap-3 md:grid-cols-2">{FIELD_LABELS.map((field) => <label key={field.key} className="text-sm font-bold text-slate-700">{field.label}{field.required ? ' required' : ''}<select value={mapping[field.key]} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}><option value="">Leave blank</option>{columns.map((column) => <option key={column} value={column}>{column}</option>)}</select></label>)}</div> : null}<button type="button" onClick={addMappedRows} className="mt-4 bg-[#070A18] text-white">Add Detected Rows</button></div> : null}

        {previewColumns.length ? <div className={`mt-5 rounded-2xl border p-4 ${canAddDetectedRows ? 'border-emerald-200 bg-emerald-50' : 'border-tan bg-ivory'}`}><div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between"><div><p className={`text-xs font-bold uppercase tracking-[0.2em] ${canAddDetectedRows ? 'text-emerald-700' : 'text-sage'}`}>File Preview</p><h3 className="mt-1 text-xl font-extrabold text-ink">{canAddDetectedRows ? 'We detected your inventory data - please confirm' : 'Review detected columns'}</h3></div><p className="text-sm font-bold text-slate-600">{importedRows.length} rows detected</p></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{previewColumns.map((column) => <th key={column} className="px-3 py-2">{column}</th>)}</tr></thead><tbody className="font-semibold text-slate-700">{importedRows.slice(0, 5).map((row, index) => <tr key={index} className="border-t border-tan/70">{previewColumns.map((column) => <td key={column} className="max-w-[220px] truncate px-3 py-3">{text(row[column]) || '-'}</td>)}</tr>)}</tbody></table></div></div> : null}
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
