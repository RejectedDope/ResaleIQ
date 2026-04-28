'use client'

import { useMemo, useState } from 'react'
import RecommendationList from '@/components/RecommendationList'
import { recommendAudit } from '@/lib/auditAgent'

export default function AuditPage() {
  const [answers] = useState({
    platforms: ['eBay', 'Poshmark'],
    activeListings: '50–100',
    staleListings: '25–50',
    categories: ['Fashion', 'Luxury'],
    biggestProblem: 'weak margins',
    desiredOutcome: 'recover cash flow'
  })

  const result = useMemo(() => recommendAudit(answers), [answers])

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dead Inventory Audit Agent</h1>
          <p className="mt-2 text-sm text-[#5C5449]">
            Answer a few questions and ResaleIQ will recommend the right audit path.
          </p>
        </div>

        <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6 space-y-4">
          <h2 className="text-xl font-semibold">Recommended Audit</h2>
          <p className="text-2xl font-bold">{result.tier} — {result.price}</p>
          <p><strong>Urgency:</strong> {result.urgency}</p>
          <p><strong>Biggest Risk:</strong> {result.biggestRisk}</p>
          <p className="text-sm text-[#5C5449]">{result.explanation}</p>
        </section>

        <RecommendationList items={result.nextSteps} />

        <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
          <p className="font-semibold">Next Step</p>
          <p className="mt-2 text-sm text-[#5C5449]">
            Complete payment using your selected audit tier and begin recovery planning.
          </p>
          <a
            href="https://www.paypal.biz/jaynedopecustoms"
            target="_blank"
            className="mt-4 inline-block rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white"
          >
            Continue to Payment
          </a>
        </section>
      </div>
    </div>
  )
}
