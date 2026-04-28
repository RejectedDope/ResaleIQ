type ListingOutputCardProps = {
  title: string
  content: string
}

export default function ListingOutputCard({ title, content }: ListingOutputCardProps) {
  return (
    <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm text-[#1A1714]">{content}</p>
    </div>
  )
}
