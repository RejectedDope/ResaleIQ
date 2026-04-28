import React from 'react';

type ListingOutputCardProps = {
  label: string;
  value: string;
};

export function ListingOutputCard({ label, value }: ListingOutputCardProps) {
  return (
    <div className="rounded-xl border border-tan bg-white p-4">
      <h4 className="text-xs uppercase tracking-wide text-slate-500">{label}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}
