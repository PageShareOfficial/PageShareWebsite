'use client';

import Link from 'next/link';
import { BarChart3, Target, TrendingUp } from 'lucide-react';
import { FaMedal } from 'react-icons/fa';
import Topbar from '@/components/app/layout/Topbar';

/** Placeholder metrics — same layout for self-view and investor viewing an analyst. */
const ANALYTICS_METRIC_PLACEHOLDERS = [
  { label: 'Rank', value: '—', icon: FaMedal, accentClass: 'text-amber-400/90' },
  { label: 'Win rate', value: '—', icon: TrendingUp, accentClass: 'text-emerald-400/90' },
  { label: 'Total predictions', value: '—', icon: Target, accentClass: 'text-sky-400/90' },
] as const;

interface AnalyticsPageContentProps {
  /** When omitted, the page shows the signed-in user's own analytics. */
  subjectUsername?: string;
}

export default function AnalyticsPageContent({
  subjectUsername,
}: AnalyticsPageContentProps) {
  const isOwnAnalytics = !subjectUsername;
  const subtitle = isOwnAnalytics
    ? 'Your prediction performance scorecard.'
    : `Prediction performance for @${subjectUsername}.`;

  return (
    <>
      <Topbar />
      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
          <header className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <BarChart3 className="h-6 w-6 text-blue-400/90" aria-hidden />
              Analytics
            </h1>
            <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
          </header>

          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
            {ANALYTICS_METRIC_PLACEHOLDERS.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div
                    className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${metric.accentClass}`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {metric.label}
                  </div>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                    {metric.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center">
            <p className="mb-4 text-sm text-gray-400">
              Detailed prediction history and outcome charts will appear here.
            </p>
            <Link
              href="/predictions"
              className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
            >
              Back to predictions
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
