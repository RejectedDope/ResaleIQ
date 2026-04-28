'use client'

import { useMemo, useState } from 'react'
import ListingOutputCard from '@/components/ListingOutputCard'
import ScoreCard from '@/components/ScoreCard'
import RecommendationList from '@/components/RecommendationList'
import { generateListing } from '@/lib/listingGenerator'
import { calculateCompliance } from '@/lib/compliance'
import { recommendPlatform } from '@/lib/platformRecommendation'

export default function AnalyzePage() {
  const [form] = useState({
    itemTitle: 'Coach Leather Tote',
    brand: 'Coach',
    category: 'Fashion',
    condition: 'Very Good Used Condition',
    size: 'One Size',
    color: 'Black',
    material: 'Leather',
    targetSalePrice: 95,
    listingAgeDays: 12
  })

  const compliance = useMemo(() => calculateCompliance(form), [form])
  const listing = useMemo(() => generateListing(form), [form])
  const bestPlatform = useMemo(() => recommendPlatform(form), [form])

  const fastSalePrice = (form.targetSalePrice * 0.85).toFixed(2)
  const balancedPrice = form.targetSalePrice.toFixed(2)
  const maxValuePrice = (form.targetSalePrice * 1.2).toFixed(2)

  const visibilityScore = Math.max(50, compliance.score - 10)
  const profitScore = Math.min(100, Math.round((form.targetSalePrice / 100) * 75))

  const recommendations = [
    compliance.score < 80 ? 'Improve missing compliance fields before listing' : 'Compliance looks healthy',
    `Best platform currently recommended: ${bestPlatform}`,
    'Use fast sale price if turnover speed matters more than max margin',
    'Crosslist if listing remains unsold beyond 45 days'
  ]

  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">New Item Analysis</h1>
          <p className="mt-2 text-sm text-[#5C5449]">Determine if the item is worth listing and how to price it.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScoreCard label="Compliance Score" value={compliance.score} />
          <ScoreCard label="Profit Score" value={profitScore} />
          <ScoreCard label="Visibility Score" value={visibilityScore} />
          <ScoreCard label="Best Platform" value={bestPlatform} />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5">
            <h2 className="text-lg font-semibold">Pricing Strategy</h2>
            <div className="mt-4 space-y-2 text-sm">
              <p>Fast Sale Price: ${fastSalePrice}</p>
              <p>Balanced Price: ${balancedPrice}</p>
              <p>Max Value Price: ${maxValuePrice}</p>
            </div>
          </div>

          <RecommendationList items={recommendations} />
        </section>

        <section className="grid gap-4">
          <ListingOutputCard title="eBay SEO Title" content={listing.ebayTitle} />
          <ListingOutputCard title="Listing Description" content={listing.description} />
        </section>
      </div>
    </main>
  )
}
