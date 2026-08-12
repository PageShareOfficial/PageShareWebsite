import type { CSSProperties } from 'react';

export const PODIUM_RANK_COLORS = {
  1: '#FBBF24',
  2: '#E2E8F0',
  3: '#F97316',
} as const;

/** Cyan border for the viewer's own leaderboard row (non-podium ranks only). */
export const OWN_ROW_BORDER_COLOR = '#22D3EE';

export function getMedalColor(rank: number): string {
  return getPodiumBorderColor(rank) ?? '';
}

export function getPodiumBorderColor(rank: number): string | undefined {
  if (rank === 1) return PODIUM_RANK_COLORS[1];
  if (rank === 2) return PODIUM_RANK_COLORS[2];
  if (rank === 3) return PODIUM_RANK_COLORS[3];
  return undefined;
}

export function shouldHighlightOwnLeaderboardRow(
  rank: number,
  isOwnRow: boolean
): boolean {
  return isOwnRow && rank > 3;
}

export function getPodiumBorderStyle(
  rank: number,
  options?: { highlightOwn?: boolean }
): CSSProperties | undefined {
  const podiumColor = getPodiumBorderColor(rank);
  if (podiumColor) {
    return { borderColor: podiumColor };
  }
  if (options?.highlightOwn) {
    return { borderColor: OWN_ROW_BORDER_COLOR };
  }
  return undefined;
}

export function getPodiumRowClass(
  rank: number,
  options?: { highlightOwn?: boolean }
): string {
  if (rank <= 3) return '';
  if (options?.highlightOwn) {
    return 'border-cyan-400/90 hover:border-cyan-300';
  }
  return 'border-white/10 hover:border-white/15';
}

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'border-amber-300/70 text-amber-200 bg-amber-400/10';
  if (rank === 2) return 'border-slate-200/60 text-slate-100 bg-slate-300/10';
  if (rank === 3) return 'border-orange-300/60 text-orange-200 bg-orange-400/10';
  return 'border-white/15 text-gray-200 bg-white/5';
}

/** “You” badge fill: podium colors for top 3, cyan otherwise. Text is always black. */
export function getOwnYouBadgeStyle(rank: number): CSSProperties {
  const fill = getPodiumBorderColor(rank) ?? OWN_ROW_BORDER_COLOR;
  return { backgroundColor: fill, color: '#000000' };
}
