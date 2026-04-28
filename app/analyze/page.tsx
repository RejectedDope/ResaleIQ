import ListingOutputCard from '@/components/ListingOutputCard'
import { generateListing } from '@/lib/listingGenerator'

export default function AnalyzePage() {
  const result = generateListing({
    brand: 'Coach',
    itemTitle: 'Leather Tote',
    color: 'Black',
    condition: 'Used',
    category: 'Fashion'
  })

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">New Item Analysis</h1>
      <div className="space-y-4">
        <ListingOutputCard title="eBay Title" content={result.ebayTitle} />
        <ListingOutputCard title="Description" content={result.description} />
      </div>
    </main>
  )
}
