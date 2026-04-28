import { sampleDeadListings } from '@/lib/sampleData'

export default function DeadListingsPage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Dead Listing Detector</h1>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E2DDD5] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2DDD5] text-left">
                <th className="p-4">Item</th>
                <th>Platform</th>
                <th>Age</th>
                <th>Price</th>
                <th>Risk</th>
                <th>Issue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sampleDeadListings.map((row, i) => (
                <tr key={i} className="border-b border-[#F0EDE6]">
                  <td className="p-4">{row.item}</td>
                  <td>{row.platform}</td>
                  <td>{row.age} days</td>
                  <td>${row.price}</td>
                  <td>{row.deadRisk}</td>
                  <td>{row.topIssue}</td>
                  <td>{row.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
