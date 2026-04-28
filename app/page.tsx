import ScoreCard from '@/components/ScoreCard'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">ResaleIQ Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ScoreCard label="Listings Analyzed" value={128} />
          <ScoreCard label="High-Risk Listings" value={14} />
          <ScoreCard label="Dead Inventory Alerts" value={22} />
          <ScoreCard label="Estimated Profit Leaks" value="$1,840" />
          <ScoreCard label="Avg Listing Health" value="78" />
        </div>
      </div>
    </main>
  )
}
