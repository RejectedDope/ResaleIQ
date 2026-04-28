type DeadListingInput = {
  listingAgeDays: number
  complianceScore: number
  profitScore: number
  itemTitle?: string
  condition?: string
  platformMismatch?: boolean
}

export function calculateDeadListingRisk(input: DeadListingInput) {
  let risk = 0;

  if (input.listingAgeDays > 60) risk += 25
  if (input.complianceScore < 70) risk += 20
  if (input.profitScore < 50) risk += 15
  if ((input.itemTitle || '').length < 45) risk += 15
  if (!input.condition) risk += 10
  if (input.platformMismatch) risk += 10

  const level: 'Low' | 'Medium' | 'High' =
    risk >= 60 ? 'High' : risk >= 30 ? 'Medium' : 'Low'

  return { risk, level }
}
