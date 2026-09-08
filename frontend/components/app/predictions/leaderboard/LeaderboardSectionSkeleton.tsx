'use client';

import Skeleton, { TextSkeleton } from '@/components/app/common/Skeleton';

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 lg:hidden">
      <Skeleton variant="text" width={24} height={20} />
      <Skeleton variant="circular" width={36} height={36} />
      <div className="min-w-0 flex-1 space-y-2">
        <TextSkeleton width="55%" height={14} />
        <TextSkeleton width="35%" height={12} />
      </div>
      <Skeleton variant="rectangular" width={48} height={28} rounded="rounded-lg" />
    </div>
  );
}

function LeaderboardTableSkeleton() {
  return (
    <div className="hidden space-y-2 px-2 py-2 lg:block">
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {[72, 140, 64, 56, 56].map((width, index) => (
          <TextSkeleton key={index} width={width} height={12} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-2 py-2">
          <Skeleton variant="text" width={28} height={18} />
          <Skeleton variant="circular" width={36} height={36} />
          <TextSkeleton width="30%" height={14} className="flex-1" />
          <TextSkeleton width={48} height={14} />
          <TextSkeleton width={40} height={14} />
          <TextSkeleton width={56} height={14} />
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardSectionSkeleton() {
  return (
    <div className="px-3 py-3" aria-busy="true" aria-label="Loading leaderboard">
      <div className="space-y-2.5 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <LeaderboardRowSkeleton key={index} />
        ))}
      </div>
      <LeaderboardTableSkeleton />
    </div>
  );
}
