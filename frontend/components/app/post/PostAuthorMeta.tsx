'use client';

import AuthorBadges from '@/components/app/common/AuthorBadges';
import type { User } from '@/types';

interface PostAuthorMetaProps {
  displayName: string;
  handle: string;
  subscriptionPlanId?: User['subscriptionPlanId'];
  createdAt?: string;
  size?: 'sm' | 'md';
  onDisplayNameClick?: (e: React.MouseEvent) => void;
}

/**
 * Single-line author row: truncated display name, handle, badge, and optional date.
 */
export default function PostAuthorMeta({
  displayName,
  handle,
  subscriptionPlanId,
  createdAt,
  size = 'md',
  onDisplayNameClick,
}: PostAuthorMetaProps) {
  const nameSizeClass = size === 'sm' ? 'text-sm' : '';
  const metaSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
      <span
        className={`min-w-0 shrink truncate font-semibold text-white ${nameSizeClass} ${
          onDisplayNameClick ? 'cursor-pointer hover:underline' : ''
        }`}
        onClick={onDisplayNameClick}
        title={displayName}
      >
        {displayName}
      </span>
      <span className={`${metaSizeClass} shrink-0 text-gray-400`}>@{handle}</span>
      <AuthorBadges
        subscriptionPlanId={subscriptionPlanId}
        size={size === 'sm' ? 'sm' : 'md'}
        className="shrink-0"
      />
      {createdAt ? (
        <span className={`${metaSizeClass} shrink-0 text-gray-500`}>· {createdAt}</span>
      ) : null}
    </div>
  );
}
