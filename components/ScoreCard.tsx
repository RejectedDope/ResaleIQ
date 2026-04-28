import React from 'react';

type ScoreCardProps = {
  title: string;
  value: number | string;
  helper?: string;
};

export function ScoreCard({ title, value, helper }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-tan bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-600">{helper}</p> : null}
    </div>
  );
}
