import Link from 'next/link'

const pricingTiers = [
  {
    name: 'Quick Recovery Audit',
    price: '$39',
    listings: 'Up to 20 listings',
    extras: '+$1 per additional listing'
  },
  {
    name: 'Standard Recovery Audit',
    price: '$79',
    listings: 'Up to 50 listings',
    extras: '+$0.75 per additional listing'
  },
  {
    name: 'Growth Recovery Audit',
    price: '$149',
    listings: 'Up to 100 listings',
    extras: '+$0.50 per additional listing'
  },
  {
    name: 'High Volume Seller',
    price: 'Custom Quote',
    listings: '150+ listings',
    extras: 'Scope reviewed before pricing'
  }
]

export default function AuditCTA() {
  return (
    <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-[#D45C2D]">Paid Offer</p>
        <h2 className="text-2xl font-bold">Dead Inventory Audit</h2>
        <p className="text-sm text-[#5C5449]">
          Recover trapped cash from stale inventory, weak pricing, and low-converting listings.
          Get a direct action plan instead of guessing what to relist, reprice, or liquidate.
        </p>

        <div className="space-y-3">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className="rounded-xl border border-[#F0EDE6] p-4">
              <p className="font-semibold">{tier.name} — {tier.price}</p>
              <p className="text-sm text-[#5C5449]">{tier.listings}</p>
              <p className="text-sm text-[#5C5449]">{tier.extras}</p>
            </div>
          ))}
        </div>

        <Link
          href="/audit"
          className="inline-block rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white"
        >
          Start Audit Agent
        </Link>
      </div>
    </section>
  )
}
