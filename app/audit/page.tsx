'use client'

import { useMemo, useState } from 'react'
import RecommendationList from '@/components/RecommendationList'
import { AuditAnswers, recommendAudit } from '@/lib/auditAgent'

const initialAnswers: AuditAnswers = {
  platforms: [],
  activeListings: '',
  staleListings: '',
  categories: [],
  biggestProblem: '',
  desiredOutcome: ''
}

const platformOptions = ['eBay', 'Poshmark', 'Mercari', 'Facebook Marketplace', 'Depop', 'Other']
const listingOptions = ['Under 25', '25–50', '50–100', '100–250', '250+']
const staleOptions = ['Under 10', '10–25', '25–50', '50–100', '100+']
const categoryOptions = ['Luxury', 'Fashion', 'Vintage', 'Collectibles', 'Toys', 'Furniture', 'Beauty', 'Mixed Inventory']
const problemOptions = ['stale inventory', 'low sales', 'weak margins', 'pricing confusion', 'too much dead stock', 'poor crosslisting strategy', 'platform confusion', 'hidden fee issues']

export default function AuditPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AuditAnswers>(initialAnswers)
  const result = useMemo(() => recommendAudit(answers), [answers])

  function toggleArray(field: 'platforms' | 'categories', value: string) {
    const current = answers[field]
    setAnswers({
      ...answers,
      [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    })
  }

  function canContinue() {
    if (step === 0) return answers.platforms.length > 0
    if (step === 1) return Boolean(answers.activeListings)
    if (step === 2) return Boolean(answers.staleListings)
    if (step === 3) return answers.categories.length > 0
    if (step === 4) return Boolean(answers.biggestProblem)
    if (step === 5) return Boolean(answers.desiredOutcome.trim())
    return true
  }

  const progress = Math.round(((step + 1) / 7) * 100)

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dead Inventory Audit Agent</h1>
          <p className="mt-2 text-sm text-[#5C5449]">Answer a few questions and ResaleIQ will recommend the right audit path.</p>
        </div>

        <div className="rounded-full bg-[#E2DDD5]"><div className="h-2 rounded-full bg-[#D45C2D]" style={{ width: `${progress}%` }} /></div>

        {step < 6 && (
          <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
            <h2 className="text-xl font-semibold">
              {[
                'Where do you sell right now?',
                'How many active listings do you have?',
                'How many listings are over 60 days old?',
                'What categories do you sell?',
                'What feels most broken right now?',
                'What outcome do you want most?'
              ][step]}
            </h2>
            <div className="mt-5">
              {step === 0 && <OptionGrid options={platformOptions} selected={answers.platforms} onSelect={(v) => toggleArray('platforms', v)} />}
              {step === 1 && <OptionGrid options={listingOptions} selected={[answers.activeListings]} onSelect={(v) => setAnswers({ ...answers, activeListings: v })} />}
              {step === 2 && <OptionGrid options={staleOptions} selected={[answers.staleListings]} onSelect={(v) => setAnswers({ ...answers, staleListings: v })} />}
              {step === 3 && <OptionGrid options={categoryOptions} selected={answers.categories} onSelect={(v) => toggleArray('categories', v)} />}
              {step === 4 && <OptionGrid options={problemOptions} selected={[answers.biggestProblem]} onSelect={(v) => setAnswers({ ...answers, biggestProblem: v })} />}
              {step === 5 && (
                <textarea
                  className="min-h-32 w-full rounded-xl border border-[#E2DDD5] p-4 text-sm"
                  value={answers.desiredOutcome}
                  onChange={(e) => setAnswers({ ...answers, desiredOutcome: e.target.value })}
                  placeholder="Recover cash flow, improve pricing, move stale inventory faster"
                />
              )}
            </div>
          </section>
        )}

        {step === 6 && (
          <>
            <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6 space-y-4">
              <h2 className="text-xl font-semibold">Recommended Audit</h2>
              <p className="text-2xl font-bold">{result.tier} — {result.price}</p>
              <p><strong>Urgency:</strong> {result.urgency}</p>
              <p><strong>Biggest Risk:</strong> {result.biggestRisk}</p>
              <p className="text-sm text-[#5C5449]">{result.explanation}</p>
            </section>
            <RecommendationList items={result.nextSteps} />
            <section className="rounded-2xl border border-[#E2DDD5] bg-white p-6">
              <a href="https://www.paypal.biz/jaynedopecustoms" target="_blank" className="inline-block rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white">Continue to Payment</a>
            </section>
          </>
        )}

        <div className="flex justify-between">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl border border-[#E2DDD5] bg-white px-5 py-3 text-sm font-semibold disabled:opacity-40">Back</button>
          {step < 6 && <button disabled={!canContinue()} onClick={() => setStep(step + 1)} className="rounded-xl bg-[#D45C2D] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Continue</button>}
        </div>
      </div>
    </div>
  )
}

function OptionGrid({ options, selected, onSelect }: { options: string[]; selected: string[]; onSelect: (value: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button key={option} onClick={() => onSelect(option)} className={`rounded-xl border p-4 text-left text-sm font-medium ${selected.includes(option) ? 'border-[#D45C2D] bg-[#FDF0EE]' : 'border-[#E2DDD5] bg-white'}`}>
          {option}
        </button>
      ))}
    </div>
  )
}
