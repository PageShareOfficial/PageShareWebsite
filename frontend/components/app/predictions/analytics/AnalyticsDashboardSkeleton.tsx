'use client';

import type { ReactNode } from 'react';
import Skeleton, {
  AvatarSkeleton,
  TextSkeleton,
} from '@/components/app/common/Skeleton';

function SectionShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function ChartBlockSkeleton({ height = 192 }: { height?: number }) {
  return (
    <Skeleton
      variant="rectangular"
      width="100%"
      height={height}
      rounded="rounded-xl"
      className="border border-white/10"
    />
  );
}

/** Matches AnalyticsDonutChart layout (chart + legend); chart area uses rectangular shimmer. */
function DonutBlockSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <Skeleton
        variant="rectangular"
        width={160}
        height={160}
        rounded="rounded-xl"
        className="shrink-0 border border-white/10"
      />
      <div className="w-full min-w-[140px] space-y-3 sm:w-auto">
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="85%" height={14} />
        <Skeleton variant="text" width="90%" height={14} />
      </div>
    </div>
  );
}

function BarGroupSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index}>
          <div className="mb-1 flex justify-between">
            <Skeleton variant="text" width={72} height={12} />
            <Skeleton variant="text" width={24} height={12} />
          </div>
          <Skeleton variant="rectangular" width="100%" height={12} rounded="rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboardSkeleton({
  isOwnAnalytics = true,
}: {
  isOwnAnalytics?: boolean;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading analytics dashboard">
      <section className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 p-4 sm:p-6">
        <div
          className={`flex flex-col gap-4 ${
            isOwnAnalytics ? '' : 'lg:flex-row lg:items-center lg:justify-between'
          }`}
        >
          <div className="flex items-start gap-3">
            <AvatarSkeleton size={56} />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton variant="text" width={180} height={22} />
              <Skeleton variant="text" width="100%" height={14} className="max-w-md" />
              <Skeleton variant="text" width={220} height={14} />
            </div>
          </div>
          {!isOwnAnalytics ? (
            <div className="flex shrink-0 justify-start lg:justify-end">
              <Skeleton
                variant="rectangular"
                width={44}
                height={44}
                rounded="rounded-xl"
              />
            </div>
          ) : null}
        </div>
      </section>

      <SectionShell>
        <Skeleton variant="text" width={120} height={18} className="mb-2" />
        <Skeleton variant="text" width="90%" height={14} className="mb-4 max-w-lg" />
        <ChartBlockSkeleton height={208} />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <Skeleton variant="text" width={100} height={12} className="mb-3" />
            <DonutBlockSkeleton />
          </div>
          <div>
            <Skeleton variant="text" width={120} height={12} className="mb-3" />
            <BarGroupSkeleton rows={3} />
          </div>
        </div>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={40}
          rounded="rounded-lg"
          className="mt-4"
        />
      </SectionShell>

      <SectionShell>
        <Skeleton variant="text" width={110} height={18} className="mb-2" />
        <Skeleton variant="text" width={240} height={14} className="mb-4" />
        <div className="grid gap-6 lg:grid-cols-2">
          <DonutBlockSkeleton />
          <BarGroupSkeleton rows={3} />
        </div>
        <div className="mt-6">
          <Skeleton variant="text" width={140} height={12} className="mb-2" />
          <Skeleton variant="rectangular" width="100%" height={16} rounded="rounded-full" />
        </div>
      </SectionShell>

      <SectionShell>
        <Skeleton variant="text" width={130} height={18} className="mb-4" />
        <div className="grid gap-6 lg:grid-cols-2">
          <DonutBlockSkeleton />
          <BarGroupSkeleton rows={4} />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ChartBlockSkeleton height={100} />
          <ChartBlockSkeleton height={100} />
        </div>
      </SectionShell>
    </div>
  );
}

export function AnalyticsPredictionsTabSkeleton() {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
      aria-busy="true"
      aria-label="Loading predictions"
    >
      <Skeleton variant="text" width={160} height={18} className="mb-4" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="mb-3 rounded-lg border border-white/10 p-4 last:mb-0"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={48} height={14} />
          </div>
          <TextSkeleton lines={2} className="mt-3" height={12} />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsTabBarSkeleton() {
  return (
    <div className="mb-6 flex border-b border-white/10">
      <Skeleton variant="rectangular" width="50%" height={56} rounded={false} />
      <Skeleton variant="rectangular" width="50%" height={56} rounded={false} />
    </div>
  );
}
