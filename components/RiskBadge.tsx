import React from 'react';

type RiskBadgeProps = { level: 'Low' | 'Medium' | 'High' };

const STYLES: Record<RiskBadgeProps['level'], string> = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-orange-100 text-orange-800',
  High: 'bg-red-100 text-red-800',
};

export function RiskBadge({ level }: RiskBadgeProps) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STYLES[level]}`}>{level} Risk</span>;
}
