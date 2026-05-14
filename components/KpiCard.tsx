type Props = { label: string; value: string; tone?: 'neutral'|'warn'|'danger'|'profit'; sub?: string };

const tones = {
  neutral: 'border-slate-700 text-slate-100',
  warn: 'border-amber-500/60 text-amber-200',
  danger: 'border-rose-500/60 text-rose-200',
  profit: 'border-emerald-500/60 text-emerald-200',
};

export default function KpiCard({ label, value, tone='neutral', sub }: Props) {
  return (
    <div className={`rounded-xl border bg-[#1A1A1A] p-4 ${tones[tone]}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}
