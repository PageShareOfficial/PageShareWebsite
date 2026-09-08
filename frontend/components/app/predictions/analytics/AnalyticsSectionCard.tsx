'use client';

import type { ReactNode } from 'react';

interface AnalyticsSectionCardProps {
  title: string;
  titleMeta?: ReactNode;
  children: ReactNode;
}

export default function AnalyticsSectionCard({
  title,
  titleMeta,
  children,
}: AnalyticsSectionCardProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {titleMeta}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
