import { analyzeListing } from '@/lib/listingGenerator';
import { sampleInventory } from '@/lib/sampleData';

export default function InventoryPage() {
  const rows = sampleInventory.map((item) => ({ item, analysis: analyzeListing(item) }));
  const recoverableRevenue = rows.reduce((sum, row) => sum + row.item.targetSalePrice, 0);

  return <section className="space-y-6">
    <h1 className="text-3xl font-extrabold">Inventory Intelligence</h1>
    <p className="font-bold">Recoverable Revenue: ${recoverableRevenue.toFixed(0)}</p>
    <div className="grid gap-3">
      {rows.map(({ item, analysis }) => (
        <div key={item.title} className="rounded-xl border p-4">
          <p className="font-bold">{item.title}</p>
          <p>Decay {analysis.deadListingRisk.decayScore} • Exposure {analysis.deadListingRisk.exposureScore} • Health {analysis.deadListingRisk.listingHealthScore}</p>
          <p>Lifecycle: {analysis.deadListingRisk.lifecycleStage} • Recovery Priority: {analysis.deadListingRisk.recoveryPriority}</p>
        </div>
      ))}
    </div>
  </section>;
}
