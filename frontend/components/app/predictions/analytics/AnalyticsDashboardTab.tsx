'use client';

import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';
import SaveAnalystButton from '@/components/app/predictions/SaveAnalystButton';
import AnalyticsDonutChart from '@/components/app/predictions/analytics/AnalyticsDonutChart';
import AnalyticsHorizontalBarChart from '@/components/app/predictions/analytics/AnalyticsHorizontalBarChart';
import AnalyticsNetRrAreaChart from '@/components/app/predictions/analytics/AnalyticsNetRrAreaChart';
import AnalyticsStackedBarChart from '@/components/app/predictions/analytics/AnalyticsStackedBarChart';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import {
  buildHeroSubline,
  buildRecentFormInsight,
  formatNetRr,
  formatPercent,
  formatRank,
  formatSignedPercent,
} from '@/utils/predictions/analyticsFormat';

const OUTCOME_COLORS = {
  win: 'rgb(52 211 153 / 0.9)',
  loss: 'rgb(248 113 113 / 0.85)',
  expired: 'rgb(156 163 175 / 0.75)',
} as const;

interface AnalyticsDashboardTabProps {
  dashboard: PredictionAnalyticsDashboard;
  isOwnAnalytics: boolean;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AnalyticsDashboardTab({
  dashboard,
  isOwnAnalytics,
}: AnalyticsDashboardTabProps) {
  const [netRrHelpOpen, setNetRrHelpOpen] = useState(false);
  const { subject, lifetime, recent_30d: recent, style } = dashboard;
  const displayName = subject.display_name?.trim() || subject.username;

  const savedAnalyst = {
    id: subject.id,
    displayName,
    handle: subject.username,
    avatar: subject.profile_picture_url ?? '',
    subscriptionPlanId: 'analyst' as const,
  };

  const recentOutcomeSegments = [
    { label: 'Wins', value: recent.wins, color: OUTCOME_COLORS.win },
    { label: 'Losses', value: recent.losses, color: OUTCOME_COLORS.loss },
    { label: 'Expired', value: recent.expired, color: OUTCOME_COLORS.expired },
  ];

  const lifetimeOutcomeSegments = [
    { label: 'Wins', value: lifetime.wins, color: OUTCOME_COLORS.win },
    { label: 'Losses', value: lifetime.losses, color: OUTCOME_COLORS.loss },
    { label: 'Expired', value: lifetime.expired, color: OUTCOME_COLORS.expired },
  ];

  const pipelineBars = [
    {
      label: 'Total locked',
      value: lifetime.total_predictions,
      color: 'rgb(96 165 250 / 0.85)',
    },
    {
      label: 'Resolved',
      value: lifetime.resolved_count,
      color: 'rgb(52 211 153 / 0.85)',
    },
    {
      label: 'Still active',
      value: lifetime.active_count,
      color: 'rgb(251 191 36 / 0.85)',
    },
  ];

  const assetBars = style.top_assets.map((item, index) => ({
    label: item.asset,
    value: item.count,
    color:
      index === 0
        ? 'rgb(52 211 153 / 0.9)'
        : `rgb(52 211 153 / ${Math.max(0.35, 0.85 - index * 0.15)})`,
  }));

  const longShortSegments =
    style.long_count + style.short_count > 0
      ? [
          {
            label: 'Long',
            value: style.long_count,
            color: 'rgb(52 211 153 / 0.9)',
          },
          {
            label: 'Short',
            value: style.short_count,
            color: 'rgb(96 165 250 / 0.85)',
          },
        ]
      : [];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/5 p-4 sm:p-6">
        <div
          className={`flex flex-col gap-4 ${
            isOwnAnalytics ? '' : 'lg:flex-row lg:items-center lg:justify-between'
          }`}
        >
          <div className="flex items-start gap-3">
            <AvatarWithFallback
              src={subject.profile_picture_url ?? undefined}
              alt={displayName}
              size={56}
              fallbackText={displayName.slice(0, 2)}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white">{displayName}</h2>
                <VerifiedTickIcon variant="analyst" size={18} title="Analyst" />
                <span className="text-sm text-gray-400">@{subject.username}</span>
              </div>
              <p className="mt-2 text-sm text-gray-300">
                {buildHeroSubline(dashboard)}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-300/90">
                {formatRank(dashboard.rank, dashboard.rank_total)} · Net RR{' '}
                {formatNetRr(dashboard.net_rr_30d)} (30d)
              </p>
            </div>
          </div>
          {!isOwnAnalytics ? (
            <div className="flex shrink-0 justify-start lg:justify-end">
              <SaveAnalystButton
                analyst={savedAnalyst}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 hover:bg-white/15"
              />
            </div>
          ) : null}
        </div>
      </section>

      <SectionCard
        title="Recent form"
        subtitle={buildRecentFormInsight(dashboard)}
      >
        <AnalyticsNetRrAreaChart
          series={dashboard.net_rr_series_30d}
          title="Cumulative Net RR (30 days)"
          caption={formatNetRr(recent.net_rr)}
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Outcomes (30d)
            </p>
            <AnalyticsDonutChart
              segments={recentOutcomeSegments}
              centerValue={formatPercent(recent.win_rate_percent)}
              centerLabel="Win rate"
              emptyMessage="No resolved calls in the last 30 days."
            />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Resolved volume (30d)
            </p>
            <AnalyticsHorizontalBarChart
              items={[
                {
                  label: 'Wins',
                  value: recent.wins,
                  color: OUTCOME_COLORS.win,
                },
                {
                  label: 'Losses',
                  value: recent.losses,
                  color: OUTCOME_COLORS.loss,
                },
                {
                  label: 'Expired',
                  value: recent.expired,
                  color: OUTCOME_COLORS.expired,
                },
              ]}
              emptyMessage="No resolved calls in the last 30 days."
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNetRrHelpOpen((open) => !open)}
          className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-gray-400 hover:bg-white/5"
        >
          How Net RR works
          {netRrHelpOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          )}
        </button>
        {netRrHelpOpen ? (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Each resolved prediction contributes setup RR: wins add +RR, losses
            subtract −RR, expired adds 0. The area chart shows how Net RR built
            over the last 30 days.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Track record"
        subtitle="Lifetime outcomes and prediction pipeline."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Outcome mix (all time)
            </p>
            <AnalyticsDonutChart
              segments={lifetimeOutcomeSegments}
              centerValue={formatPercent(lifetime.win_rate_percent)}
              centerLabel="Win rate"
              emptyMessage="No resolved predictions yet."
            />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Prediction pipeline
            </p>
            <AnalyticsHorizontalBarChart items={pipelineBars} />
            <p className="mt-4 text-xs text-gray-500">
              Avg return (resolved):{' '}
              <span className="font-medium text-gray-300">
                {formatSignedPercent(lifetime.average_return_percent)}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Outcome timeline (stacked)
          </p>
          <AnalyticsStackedBarChart segments={lifetimeOutcomeSegments} height={16} />
        </div>
      </SectionCard>

      <SectionCard title="How they trade" subtitle="Style from resolved predictions.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Long vs short
            </p>
            <AnalyticsDonutChart
              segments={longShortSegments}
              centerLabel="Bias"
              centerValue={
                style.long_percent != null
                  ? `${style.long_percent}% L`
                  : undefined
              }
              emptyMessage="No resolved predictions for direction split."
            />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Top assets
            </p>
            <AnalyticsHorizontalBarChart
              items={assetBars}
              emptyMessage="No asset breakdown yet."
            />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Avg confidence
            </p>
            {style.average_confidence != null ? (
              <>
                <AnalyticsHorizontalBarChart
                  className="mt-3"
                  items={[
                    {
                      label: 'Confidence',
                      value: Math.round(style.average_confidence * 100),
                      color: 'rgb(167 139 250 / 0.9)',
                    },
                  ]}
                  maxValue={95}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Scale 0.5–0.95 · avg {style.average_confidence}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-400">—</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Avg setup RR
            </p>
            {style.average_setup_rr != null ? (
              <>
                <AnalyticsHorizontalBarChart
                  className="mt-3"
                  items={[
                    {
                      label: 'Risk-reward at submit',
                      value: Math.round(style.average_setup_rr * 10) / 10,
                      color: 'rgb(251 191 36 / 0.9)',
                    },
                  ]}
                  maxValue={4}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Submissions require RR ≥ 1.2
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-400">—</p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
