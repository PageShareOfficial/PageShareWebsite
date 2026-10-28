'use client';

import type { ReactNode } from 'react';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import LoadingState from '@/components/app/common/LoadingState';
import type { FilteredUserItem } from '@/lib/api/contentFiltersApi';
import { EyeOff, FaUserSlash } from '@/constants/icons';

type FilteredUsersVariant = 'muted' | 'blocked';

interface VariantCopy {
  loadingText: string;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel: string;
  emptyIcon: ReactNode;
}

const VARIANT_COPY: Record<FilteredUsersVariant, VariantCopy> = {
  muted: {
    loadingText: 'Loading muted users...',
    emptyTitle: 'No muted users',
    emptyDescription:
      "Muted users' posts won't appear in your feed, but you can still see their profile",
    actionLabel: 'Unmute',
    emptyIcon: <EyeOff className="h-8 w-8 text-gray-400" />,
  },
  blocked: {
    loadingText: 'Loading blocked users...',
    emptyTitle: 'No blocked users',
    emptyDescription: "Blocked users' content won't appear anywhere on the platform",
    actionLabel: 'Unblock',
    emptyIcon: <FaUserSlash className="h-8 w-8 text-gray-400" />,
  },
};

interface FilteredUsersPanelProps {
  variant: FilteredUsersVariant;
  users: FilteredUserItem[];
  loading: boolean;
  actionError?: string | null;
  onAction: (username: string) => void | Promise<void>;
}

/** Shared muted/blocked user list with empty and loading states. */
export default function FilteredUsersPanel({
  variant,
  users,
  loading,
  actionError = null,
  onAction,
}: FilteredUsersPanelProps) {
  const copy = VARIANT_COPY[variant];

  if (loading) {
    return <LoadingState text={copy.loadingText} />;
  }

  if (users.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            {copy.emptyIcon}
          </div>
        </div>
        <p className="mb-2 text-lg text-gray-300">{copy.emptyTitle}</p>
        <p className="text-sm text-gray-400">{copy.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {actionError}
        </p>
      ) : null}
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <AvatarWithFallback
              src={user.profile_picture_url ?? undefined}
              alt={user.display_name}
              size={48}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-white">
                  {user.display_name}
                </span>
              </div>
              <p className="truncate text-sm text-gray-400">@{user.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onAction(user.username)}
            className="ml-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            {copy.actionLabel}
          </button>
        </div>
      ))}
    </div>
  );
}
