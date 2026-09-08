'use client';

import type { ReactNode } from 'react';

export const ANALYTICS_CHART_BORDER_CLASS =
  'rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4';

export function AnalyticsChartTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
      {children}
    </p>
  );
}

interface AnalyticsChartCardProps {
  title?: string;
  header?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function AnalyticsChartCard({
  title,
  header,
  className = '',
  children,
}: AnalyticsChartCardProps) {
  const titleRow =
    header ?? (title ? <AnalyticsChartTitle>{title}</AnalyticsChartTitle> : null);

  return (
    <div className={`${ANALYTICS_CHART_BORDER_CLASS} ${className}`}>
      {titleRow}
      {children}
    </div>
  );
}
