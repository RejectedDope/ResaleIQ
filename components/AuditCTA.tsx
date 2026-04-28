import Link from 'next/link'

const includedActions = [
  'Relist strategy',
  'Repricing recommendations',
  'Crosslisting opportunities',
  'Liquidation decisions'
]

export default function AuditCTA() {
  return (
    <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-[#D45C2D]">Paid Offer</p>
        <h2 className="text-2xl font-bold">Dead Inventory Audit</h2>
        <p className="text-sm text-[#5C5449]">
          Recover trapped cash from stale inventory, weak pricing, and low-converting listings.
          Get a direct action plan instead of guessing what to relist or liquidate.
        </p>
        <div className="rounded-xl border border-[#F0EDE6] p-4">
          <p className="font-semibold">Starting at $97</p>
          <ul className="mt-3 space-y-2 text-sm text-[#5C5449]">
            {includedActions.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <Link
          href="/dead-listings"
          className="inline-block rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white"
        >
          Start Audit Review
        </Link>
      </div>
    </section>
  )
}
