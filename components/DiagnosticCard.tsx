type Props = {
  title: string;
  diagnosis: string;
  confidence: string;
  action: string;
  badge?: string;
};

export default function DiagnosticCard({ title, diagnosis, confidence, action, badge }: Props) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#1A1A1A] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        {badge ? <span className="rounded bg-rose-900/50 px-2 py-1 text-xs text-rose-200">{badge}</span> : null}
      </div>
      <p className="mt-2 text-sm text-slate-300">{diagnosis}</p>
      <p className="mt-2 text-xs text-slate-400">Confidence: {confidence}</p>
      <p className="mt-2 text-sm font-semibold text-emerald-300">Next: {action}</p>
    </div>
  );
}
