import Link from 'next/link'

export default function AuditCTA() {
  return (
    <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#D45C2D]">Paid Offer</p>
        <h2 className="text-2xl font-bold">Dead Inventory Audit</h2>
        <p className="text-sm text-[#5C5449]">
          Identify stale listings, hidden profit leaks, weak pricing strategy, and inventory draining cash flow.
          Get a structured recovery plan with relist, reprice, crosslist, and liquidation recommendations.
        </p>
        <div className="pt-2">
          <p className="font-semibold">Starting at $97</p>
          <p className="text-sm text-[#5C5449]">Designed as the fastest path from free tool to paid revenue.</p>
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
