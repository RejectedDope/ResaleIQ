type RiskBadgeProps = {
  level: 'Low' | 'Medium' | 'High'
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const styles = {
    Low: 'bg-green-50 text-green-700',
    Medium: 'bg-yellow-50 text-yellow-700',
    High: 'bg-red-50 text-red-700'
  }

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[level]}`}>
      {level} Risk
    </span>
  )
}
