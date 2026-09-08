'use client';

import type { ReactNode } from 'react';

export const ANALYTICS_KPI_GRID_CLASS =
  'mb-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-4';

export function signedMetricClass(value: number | null | undefined): string {
  if (value == null || value === 0) {
    return 'text-gray-200';
  }
  return value > 0 ? 'text-emerald-400' : 'text-red-400';
}

interface AnalyticsKpiCardProps {
  label: string;
  value?: string;
  valueNode?: ReactNode;
  valueClassName?: string;
}

export function AnalyticsKpiCard({
  label,
  value,
  valueNode,
  valueClassName = 'text-white',
}: AnalyticsKpiCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-gray-500">
        {label}
      </p>
      {valueNode ?? (
        <p
          className={`mt-1.5 text-xl font-bold tabular-nums ${valueClassName}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
