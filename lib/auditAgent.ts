export type AuditAnswers = {
  platforms: string[]
  activeListings: string
  staleListings: string
  categories: string[]
  biggestProblem: string
  desiredOutcome: string
}

export type AuditRecommendation = {
  tier: 'Starter Audit' | 'Advanced Audit' | 'VIP Audit'
  price: string
  urgency: 'Low' | 'Medium' | 'High'
  biggestRisk: string
  explanation: string
  nextSteps: string[]
}

function parseRange(value: string): number {
  if (value.includes('250') || value.includes('100+')) return 100
  if (value.includes('100')) return 75
  if (value.includes('50')) return 50
  if (value.includes('25')) return 25
  return 10
}

export function recommendAudit(answers: AuditAnswers): AuditRecommendation {
  const activeScore = parseRange(answers.activeListings)
  const staleScore = parseRange(answers.staleListings)
  const multiPlatform = answers.platforms.length >= 3
  const multiCategory = answers.categories.length >= 3
  const severeProblem = ['too much dead stock', 'weak margins', 'hidden fee issues', 'low sales'].includes(
    answers.biggestProblem.toLowerCase()
  )

  let score = activeScore + staleScore
  if (multiPlatform) score += 25
  if (multiCategory) score += 15
  if (severeProblem) score += 25

  if (score >= 150) {
    return {
      tier: 'VIP Audit',
      price: '$397+',
      urgency: 'High',
      biggestRisk: 'Too much capital is likely trapped across stale inventory, pricing mistakes, and platform mismatch.',
      explanation: 'Your answers suggest this is not a small cleanup issue. You likely need a full inventory recovery strategy, not just a few relist suggestions.',
      nextSteps: [
        'Prepare inventory screenshots or spreadsheet exports.',
        'Prioritize items older than 60 days.',
        'Review pricing, platform fit, and liquidation candidates first.'
      ]
    }
  }

  if (score >= 75) {
    return {
      tier: 'Advanced Audit',
      price: '$197',
      urgency: 'Medium',
      biggestRisk: 'Your inventory likely has stale listings and pricing issues that can be corrected with a structured recovery map.',
      explanation: 'Your answers suggest enough inventory risk to justify a deeper audit focused on pricing, crosslisting, and recovery priority.',
      nextSteps: [
        'Identify your oldest listings first.',
        'Flag items with low watchers, no offers, or repeated price drops.',
        'Use repricing and crosslisting before liquidation.'
      ]
    }
  }

  return {
    tier: 'Starter Audit',
    price: '$97',
    urgency: 'Low',
    biggestRisk: 'You may have early signs of stale inventory, but this looks manageable with a focused review.',
    explanation: 'Your answers suggest a smaller audit is enough to find quick fixes and prevent inventory from becoming a larger cash flow issue.',
    nextSteps: [
      'Review up to 25 listings first.',
      'Fix missing listing fields and weak titles.',
      'Reprice slow movers before buying more inventory.'
    ]
  }
}
