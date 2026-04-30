type RecommendationListProps = {
  title: string;
  items: string[];
};

export function RecommendationList({ title, items }: RecommendationListProps) {
  return (
    <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
      <h3 className="text-base font-extrabold text-ink">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {items.map((item, idx) => (
          <li key={`${item}-${idx}`} className="flex gap-3 rounded-2xl bg-ivory px-4 py-3 leading-6">
            <span className="mt-2 h-2 w-2 flex-none rounded-full bg-sage" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
