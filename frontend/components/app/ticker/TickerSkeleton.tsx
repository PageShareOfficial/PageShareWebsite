'use client';

import Skeleton from '@/components/app/common/Skeleton';

/**
 * Loading skeleton for ticker detail page
 * Matches the layout of the actual ticker detail page
 */
export default function TickerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="text" width={192} height={32} />
              <Skeleton variant="text" width={64} height={24} />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton variant="text" width={80} height={24} />
              <Skeleton variant="text" width={96} height={16} />
              <Skeleton variant="text" width={128} height={16} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton variant="text" width={128} height={40} />
            <Skeleton variant="text" width={96} height={24} />
          </div>
        </div>
      </div>

      {/* Key Metrics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <Skeleton variant="text" width={80} height={12} className="mb-2" />
            <Skeleton variant="text" width={64} height={24} />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <Skeleton variant="rectangular" width="100%" height={256} />
      </div>

      {/* Overview Skeleton */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <Skeleton variant="text" width={128} height={24} className="mb-4" />
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="83%" height={16} />
        </div>
      </div>
    </div>
  );
}
