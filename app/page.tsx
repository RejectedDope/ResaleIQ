import ScoreCard from '@/components/ScoreCard'
import { dashboardMetrics, sampleDeadListings } from '@/lib/sampleData'

export default function DashboardPage() {
  const urgentItems = sampleDeadListings.filter((item) => item.deadRisk === 'High').slice(0, 3)

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">ResaleIQ Dashboard</h1>
          <p className="mt-2 text-sm text-[#5C5449]">Margin protection and listing intelligence overview.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ScoreCard label="Listings Analyzed" value={dashboardMetrics.listingsAnalyzed} />
          <ScoreCard label="High-Risk Listings" value={dashboardMetrics.highRiskListings} />
          <ScoreCard label="Dead Inventory Alerts" value={dashboardMetrics.deadInventoryAlerts} />
          <ScoreCard label="Estimated Profit Leaks" value={`$${dashboardMetrics.estimatedProfitLeaks}`} />
          <ScoreCard label="Avg Listing Health" value={dashboardMetrics.averageListingHealth} />
        </section>

        <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
          <h2 className="text-xl font-semibold">Urgent Recovery Actions</h2>
          <div className="mt-4 space-y-4">
            {urgentItems.map((item, index) => (
              <div key={index} className="rounded-xl border border-[#F0EDE6] p-4">
                <p className="font-semibold">{item.item}</p>
                <p className="text-sm text-[#5C5449]">Issue: {item.topIssue}</p>
                <p className="text-sm text-[#5C5449]">Recommended Action: {item.recommendedAction}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
