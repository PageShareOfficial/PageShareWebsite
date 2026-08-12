import type { LeaderboardEntry } from '@/types/predictions';

export interface LeaderboardIdentity {
  displayName: string;
  handle: string | null;
  avatarSrc: string | undefined;
  avatarAlt: string;
  /** Server-derived initials when identity is masked. */
  avatarFallbackText?: string;
}

export interface LeaderboardRowPresentation {
  isOwnRow: boolean;
  maskThisRow: boolean;
  identity: LeaderboardIdentity;
}

export function getMaskedAnalystDisplayName(rank: number): string {
  if (!Number.isInteger(rank) || rank < 1) {
    return 'Analyst';
  }
  return `Analyst_${rank}`;
}

export function isViewerOwnEntry(
  entry: LeaderboardEntry,
  viewerHandle?: string | null
): boolean {
  if (!viewerHandle?.trim()) {
    return false;
  }
  return entry.handle.trim().toLowerCase() === viewerHandle.trim().toLowerCase();
}

export function shouldMaskLeaderboardEntry(
  entry: LeaderboardEntry,
  maskIdentity: boolean,
  viewerHandle?: string | null
): boolean {
  if (!maskIdentity) {
    return false;
  }
  return !isViewerOwnEntry(entry, viewerHandle);
}

/**
 * @param maskThisRow - already resolved via shouldMaskLeaderboardEntry
 */
export function getLeaderboardIdentity(
  entry: LeaderboardEntry,
  maskThisRow: boolean
): LeaderboardIdentity {
  if (!maskThisRow) {
    return {
      displayName: entry.displayName,
      handle: entry.handle,
      avatarSrc: entry.avatar || undefined,
      avatarAlt: entry.displayName,
    };
  }

  const maskedName = getMaskedAnalystDisplayName(entry.rank);
  return {
    displayName: maskedName,
    handle: null,
    avatarSrc: undefined,
    avatarAlt: maskedName,
    avatarFallbackText: entry.avatarInitials || '?',
  };
}

export function getLeaderboardRowPresentation(
  entry: LeaderboardEntry,
  maskIdentity: boolean,
  viewerHandle?: string | null
): LeaderboardRowPresentation {
  const isOwnRow = isViewerOwnEntry(entry, viewerHandle);
  const maskThisRow = shouldMaskLeaderboardEntry(entry, maskIdentity, viewerHandle);
  return {
    isOwnRow,
    maskThisRow,
    identity: getLeaderboardIdentity(entry, maskThisRow),
  };
}
