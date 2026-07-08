import type { CSSProperties } from 'react';

export const PODIUM_RANK_COLORS = {
  1: '#FBBF24',
  2: '#E2E8F0',
  3: '#F97316',
} as const;

export function getMedalColor(rank: number): string {
  if (rank === 1) return PODIUM_RANK_COLORS[1];
  if (rank === 2) return PODIUM_RANK_COLORS[2];
  if (rank === 3) return PODIUM_RANK_COLORS[3];
  return '';
}

export function getPodiumBorderColor(rank: number): string | undefined {
  if (rank === 1) return PODIUM_RANK_COLORS[1];
  if (rank === 2) return PODIUM_RANK_COLORS[2];
  if (rank === 3) return PODIUM_RANK_COLORS[3];
  return undefined;
}

export function getPodiumBorderStyle(rank: number): CSSProperties | undefined {
  const borderColor = getPodiumBorderColor(rank);
  return borderColor ? { borderColor } : undefined;
}

export function getPodiumRowClass(rank: number): string {
  if (rank <= 3) return '';
  return 'border-white/10 hover:border-white/15';
}

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'border-amber-300/70 text-amber-200 bg-amber-400/10';
  if (rank === 2) return 'border-slate-200/60 text-slate-100 bg-slate-300/10';
  if (rank === 3) return 'border-orange-300/60 text-orange-200 bg-orange-400/10';
  return 'border-white/15 text-gray-200 bg-white/5';
}
