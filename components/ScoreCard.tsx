type ScoreCardProps = {
  label: string
  value: string | number
  helper?: string
}

export default function ScoreCard({ label, value, helper }: ScoreCardProps) {
  return (
    <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#5C5449]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#1A1714]">{value}</p>
      {helper ? <p className="mt-2 text-sm text-[#5C5449]">{helper}</p> : null}
    </div>
  )
}
