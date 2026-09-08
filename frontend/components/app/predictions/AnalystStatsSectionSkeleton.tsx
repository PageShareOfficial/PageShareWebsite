'use client';

import Skeleton, { TextSkeleton } from '@/components/app/common/Skeleton';

function StatCardSkeleton({ gradient = false }: { gradient?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-white/10 p-4 ${
        gradient ? 'bg-gradient-to-br from-amber-500/10 to-transparent' : 'bg-white/[0.03]'
      }`}
    >
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={14} height={14} />
        <TextSkeleton width="55%" height={12} />
      </div>
      <Skeleton
        variant="rectangular"
        width="48%"
        height={28}
        rounded="rounded-md"
        className="mt-2"
      />
    </div>
  );
}

export default function AnalystStatsSectionSkeleton() {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="Loading your stats">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCardSkeleton gradient />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="flex justify-center">
        <Skeleton
          variant="rectangular"
          width={140}
          height={42}
          rounded="rounded-xl"
          className="border border-white/10"
        />
      </div>
    </section>
  );
}
