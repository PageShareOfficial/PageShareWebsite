'use client';

import { useRouter } from 'next/navigation';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import AuthorBadges from '@/components/app/common/AuthorBadges';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import type { SavedAnalyst } from '@/types/savedAnalyst';

interface SavedAnalystCardProps {
  analyst: SavedAnalyst;
  cardWidth: number;
}

export default function SavedAnalystCard({ analyst, cardWidth }: SavedAnalystCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => navigateToProfile(analyst.handle, router)}
      style={{ width: cardWidth > 0 ? cardWidth : undefined }}
      className="flex shrink-0 snap-start flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      <AvatarWithFallback
        src={analyst.avatar}
        alt={analyst.displayName}
        size={52}
        className="shrink-0"
      />
      <div className="min-w-0 w-full">
        <div className="flex items-center justify-center gap-1">
          <span className="truncate text-sm font-semibold text-white">{analyst.displayName}</span>
          <AuthorBadges subscriptionPlanId={analyst.subscriptionPlanId ?? 'analyst'} size="sm" />
        </div>
        <p className="truncate text-xs text-gray-500">@{analyst.handle}</p>
      </div>
    </button>
  );
}
