type RecommendationListProps = {
  items: string[]
}

export default function RecommendationList({ items }: RecommendationListProps) {
  return (
    <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5">
      <h3 className="text-lg font-semibold">Recommendations</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={index}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}
