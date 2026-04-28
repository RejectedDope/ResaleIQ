'use client'

import { useState } from 'react'
import RiskBadge from '@/components/RiskBadge'
import RecommendationList from '@/components/RecommendationList'
import { calculateCompliance } from '@/lib/compliance'

export default function CompliancePage() {
  const [input] = useState({
    category: 'Fashion',
    condition: '',
    size: 'Medium',
    brand: '',
    color: '',
    material: ''
  })

  const result = calculateCompliance(input)

  return (
    <main className="min-h-screen bg-[#F7F5F0] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold">Compliance Checker</h1>
        <RiskBadge level={result.riskLevel} />
        <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5">
          <p className="text-2xl font-bold">Compliance Score: {result.score}</p>
          <p className="mt-2 text-sm text-[#5C5449]">{result.explanation}</p>
        </div>
        <RecommendationList items={[...result.missingFields, ...result.requiredFixes]} />
      </div>
    </main>
  )
}
