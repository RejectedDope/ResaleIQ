import React from 'react';

type RecommendationListProps = {
  title: string;
  items: string[];
};

export function RecommendationList({ title, items }: RecommendationListProps) {
  return (
    <div className="rounded-xl border border-tan bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item, idx) => (
          <li key={`${item}-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
