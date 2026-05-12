const sections = [
  'Fix These First',
  'High Stale Risk',
  'Pricing / Margin Review',
  'Listing Quality Fixes',
  'Shipping Friction',
  'Data Gaps',
];

const cards = [
  { item: 'Coach Nolita 19 Crossbody', platform: 'Poshmark', days: 112, problem: 'No listing refresh + aged inventory', action: 'Relist with new cover image and 8% price reset', confidence: 'High' },
  { item: 'Nike Air Max 90 Women 8', platform: 'eBay', days: 76, problem: 'Price above recent sold comps', action: 'Reduce by $11 and enable offers', confidence: 'High' },
  { item: 'Funko Pop Spider-Man #334', platform: 'Mercari', days: 64, problem: 'Keyword sparse title', action: 'Expand title with year and condition notes', confidence: 'Medium' },
];

export default function ResultsPage() {
  return <main className="space-y-6">{sections.map((s) => <section key={s} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-semibold">{s}</h2><div className="mt-4 grid gap-3">{cards.map((c) => <article key={`${s}-${c.item}`} className="rounded-xl border border-slate-700 p-4 text-sm"><p className="font-semibold">{c.item}</p><p className="text-slate-300">{c.platform} • {c.days} days listed</p><p>Problem: {c.problem}</p><p>Recommended action: {c.action}</p><p>Confidence: {c.confidence}</p></article>)}</div></section>)}</main>;
}
