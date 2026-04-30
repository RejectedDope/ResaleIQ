type ScoreCardProps = {
  title: string;
  value: number | string;
  helper?: string;
  tone?: 'neutral' | 'dark' | 'success' | 'warning' | 'danger';
};

const TONES: Record<NonNullable<ScoreCardProps['tone']>, string> = {
  neutral: 'border-tan bg-white text-ink',
  dark: 'border-white/10 bg-[#11172E] text-white',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  danger: 'border-red-200 bg-red-50 text-red-950',
};

export function ScoreCard({ title, value, helper, tone = 'neutral' }: ScoreCardProps) {
  const dark = tone === 'dark';

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${TONES[tone]}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
      {helper ? <p className={`mt-2 text-sm leading-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{helper}</p> : null}
    </div>
  );
}
