type ListingOutputCardProps = {
  label: string;
  value: string;
  accent?: 'violet' | 'sage' | 'clay' | 'ink';
};

const ACCENTS: Record<NonNullable<ListingOutputCardProps['accent']>, string> = {
  violet: 'text-[#7C5CFF]',
  sage: 'text-sage',
  clay: 'text-clay',
  ink: 'text-ink',
};

export function ListingOutputCard({ label, value, accent = 'ink' }: ListingOutputCardProps) {
  return (
    <div className="rounded-2xl border border-tan bg-white p-6 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</h4>
      <p className={`mt-3 text-sm font-semibold leading-7 ${ACCENTS[accent]}`}>{value}</p>
    </div>
  );
}
