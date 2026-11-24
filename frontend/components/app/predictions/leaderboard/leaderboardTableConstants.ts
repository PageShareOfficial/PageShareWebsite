/** Win-rate column width classes (Tailwind needs full literals). */
export function leaderboardDesktopWinRateColClass(
  showAnalytics: boolean,
  showSaveAnalyst: boolean,
): string {
  if (showAnalytics || showSaveAnalyst) {
    return 'w-[22%]';
  }
  return 'w-[14%]';
}
