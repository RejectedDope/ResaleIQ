import { RiskBadge } from '@/components/RiskBadge';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

export default function DeadListingsPage() {
  const rows = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Dead Listing Detector</h2>
      <div className="overflow-x-auto rounded-xl border border-tan bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ivory">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Platform</th>
              <th className="p-3">Age</th>
              <th className="p-3">Price</th>
              <th className="p-3">Compliance</th>
              <th className="p-3">Profit</th>
              <th className="p-3">Dead Risk</th>
              <th className="p-3">Top Issue</th>
              <th className="p-3">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, analysis }) => (
              <tr key={item.title} className="border-t border-tan/70 align-top">
                <td className="p-3">{item.title}</td>
                <td className="p-3">{item.platform}</td>
                <td className="p-3">{item.listingAgeDays}d</td>
                <td className="p-3">${item.targetSalePrice.toFixed(2)}</td>
                <td className="p-3">{analysis.complianceScore}</td>
                <td className="p-3">{analysis.profitScore}</td>
                <td className="p-3">
                  {analysis.deadListingRisk.riskScore} <RiskBadge level={analysis.deadListingRisk.riskLevel} />
                </td>
                <td className="p-3">{analysis.deadListingRisk.topIssue}</td>
                <td className="p-3 font-medium text-sage">{analysis.deadListingRisk.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
