import ScoreCard from '@/components/ScoreCard'
import { sampleDeadListings } from '@/lib/sampleData'

function calculateRecoverableRevenue() {
  return sampleDeadListings.reduce((total, item) => total + item.price, 0)
}

export default function DashboardPage() {
  const recoverableRevenue = calculateRecoverableRevenue()
  const highRiskListings = sampleDeadListings.filter((item) => item.deadRisk === 'High').length
  const avgCompliance = Math.round(
    sampleDeadListings.reduce((total, item) => total + item.complianceScore, 0) /
      sampleDeadListings.length
  )

  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D45C2D]">Rejected Economy</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1A1714]">ResaleIQ Dashboard</h1>
          <p className="mt-2 text-sm text-[#5C5449]">Focus on trapped money first, not vanity listing activity.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard label="Recoverable Revenue" value={`$${recoverableRevenue}`} helper="Estimated revenue trapped in stale inventory" />
          <ScoreCard label="High-Risk Listings" value={highRiskListings} helper="Listings needing immediate action" />
          <ScoreCard label="Dead Inventory Alerts" value={sampleDeadListings.length} helper="Items flagged for recovery" />
          <ScoreCard label="Average Listing Health" value={`${avgCompliance}%`} helper="Average compliance quality" />
        </section>

        <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
          <h2 className="text-xl font-semibold">Immediate Actions</h2>
          <div className="mt-4 space-y-3 text-sm">
            {sampleDeadListings.map((item) => (
              <div key={item.item} className="rounded-xl border border-[#E2DDD5] p-4">
                <p className="font-semibold">{item.item}</p>
                <p>{item.topIssue}</p>
                <p className="font-semibold text-[#3D6B4F]">Recommended: {item.recommendedAction}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
