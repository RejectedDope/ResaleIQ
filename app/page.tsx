import { ScoreCard } from '@/components/ScoreCard';
import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

export default function DashboardPage() {
  const analyses = sampleInventory.map((item) => analyzeListing(item));

  const total = analyses.length;
  const highRisk = analyses.filter((a) => a.deadListingRisk.riskLevel === 'High').length;
  const deadAlerts = analyses.filter((a) => a.deadListingRisk.riskScore >= 60).length;
  const profitLeaks = analyses.reduce((sum, a) => sum + Math.max(0, 20 - a.profitScore / 5), 0);
  const avgHealth = analyses.reduce((sum, a) => sum + (a.complianceScore + a.profitScore + a.visibilityScore) / 3, 0) / total;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ScoreCard title="Total Listings Analyzed" value={total} />
        <ScoreCard title="High-Risk Listings" value={highRisk} />
        <ScoreCard title="Dead Inventory Alerts" value={deadAlerts} />
        <ScoreCard title="Estimated Profit Leaks" value={`$${profitLeaks.toFixed(2)}`} />
        <ScoreCard title="Average Listing Health Score" value={avgHealth.toFixed(1)} helper="Out of 100" />
      </div>
    </section>
  );
}
