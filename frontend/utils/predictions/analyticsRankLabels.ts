export function buildRankTotalLabel(rankTotal: number): string | null {
  if (rankTotal <= 0) {
    return null;
  }
  return `of ${rankTotal} analyst${rankTotal === 1 ? '' : 's'}`;
}

export function buildRankAriaLabel(
  rank: number,
  rankTotal: number,
  rankTotalLabel: string | null
): string {
  if (rankTotalLabel) {
    return `Leaderboard rank ${rank} of ${rankTotal} analysts`;
  }
  return `Leaderboard rank ${rank}`;
}
