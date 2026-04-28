'use client'

import { useMemo, useState } from 'react'
import ListingOutputCard from '@/components/ListingOutputCard'
import ScoreCard from '@/components/ScoreCard'
import RecommendationList from '@/components/RecommendationList'
import { generateListing } from '@/lib/listingGenerator'
import { calculateCompliance } from '@/lib/compliance'
import { recommendPlatform } from '@/lib/platformRecommendation'

export default function AnalyzePage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    itemTitle: '',
    brand: '',
    category: 'Fashion',
    condition: '',
    size: '',
    color: '',
    material: '',
    targetSalePrice: 95,
    listingAgeDays: 12
  })

  const compliance = useMemo(() => calculateCompliance(form), [form])
  const listing = useMemo(() => generateListing(form), [form])
  const bestPlatform = useMemo(() => recommendPlatform(form), [form])

  const fastSalePrice = (Number(form.targetSalePrice) * 0.85).toFixed(2)
  const balancedPrice = Number(form.targetSalePrice).toFixed(2)
  const maxValuePrice = (Number(form.targetSalePrice) * 1.2).toFixed(2)

  const visibilityScore = Math.max(50, compliance.score - 10)
  const profitScore = Math.min(100, Math.round((Number(form.targetSalePrice) / 100) * 75))

  const recommendations = [
    compliance.score < 80 ? 'Improve missing compliance fields before listing' : 'Compliance looks healthy',
    `Best platform currently recommended: ${bestPlatform}`,
    'Use fast sale price if turnover speed matters more than max margin',
    'Crosslist if listing remains unsold beyond 45 days'
  ]

  function updateField(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: field === 'targetSalePrice' || field === 'listingAgeDays' ? Number(value) : value })
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D45C2D]">Photo Analysis</p>
          <h1 className="mt-2 text-3xl font-bold">Upload an item photo and decide if it is worth listing.</h1>
          <p className="mt-2 text-sm text-[#5C5449]">
            This MVP uses your uploaded photo plus manual item details to generate compliance, pricing, and listing recommendations.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[#E2DDD5] bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Item Upload</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="rounded-xl border border-[#E2DDD5] object-cover" />
            ) : (
              <div className="rounded-xl border border-dashed border-[#E2DDD5] p-10 text-center text-sm text-[#5C5449]">
                Upload a product photo to preview it here.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E2DDD5] bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Item Details</h2>
            <Field label="Item Title" value={form.itemTitle} onChange={(v) => updateField('itemTitle', v)} />
            <Field label="Brand" value={form.brand} onChange={(v) => updateField('brand', v)} />
            <Field label="Condition" value={form.condition} onChange={(v) => updateField('condition', v)} />
            <Field label="Color" value={form.color} onChange={(v) => updateField('color', v)} />
            <Field label="Material" value={form.material} onChange={(v) => updateField('material', v)} />
            <Field label="Target Sale Price" value={String(form.targetSalePrice)} onChange={(v) => updateField('targetSalePrice', v)} />
          </div>
        </section>

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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[#E2DDD5] bg-[#F7F5F0] p-3 text-sm font-normal"
      />
    </label>
  )
}
