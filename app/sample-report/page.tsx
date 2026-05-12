const rows = [
  { title: 'Kate Spade Leather Satchel', platform: 'Poshmark', price: '$78', days: 88, problems: 'Low photo brightness; stale at premium price', actions: 'Re-shoot cover, drop to $69, relist weekend', confidence: 'High', recovery: 'Medium-High' },
  { title: 'Adidas Ultraboost 21 Size 10', platform: 'eBay', price: '$94', days: 57, problems: 'Shipping cost set above category norm', actions: 'Move to calculated shipping and accept offers', confidence: 'Medium', recovery: 'Medium' },
  { title: 'Pokémon Base Set Blastoise (LP)', platform: 'Mercari', price: '$149', days: 103, problems: 'Condition detail buried; weak keywords', actions: 'Add condition closeups and searchable grading terms', confidence: 'High', recovery: 'High' },
  { title: 'The Ordinary + CeraVe Bundle', platform: 'Depop', price: '$39', days: 42, problems: 'Bundle value unclear in title', actions: 'Rewrite title with item count and total retail value', confidence: 'Medium', recovery: 'Medium' },
  { title: '1998 Hot Wheels Storage Case', platform: 'eBay', price: '$55', days: 121, problems: 'No dimensions, no handling time listed', actions: 'Add measurements, 1-day handling, refresh category', confidence: 'High', recovery: 'Medium-High' },
];

export default function SampleReportPage() { return <main className="space-y-4"><h1 className="text-3xl font-bold">Sample Recovery Report</h1>{rows.map((r)=><div key={r.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm"><p className="font-semibold">{r.title}</p><p className="text-slate-300">{r.platform} • Listed price {r.price} • {r.days} days</p><p>Problems detected: {r.problems}</p><p>Recommended actions: {r.actions}</p><p>Confidence level: {r.confidence}</p><p>Recovery potential: {r.recovery}</p></div>)}</main>; }
