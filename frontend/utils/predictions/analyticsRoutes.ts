/**
 * Analytics URL helpers.
 *
 * API alignment (planned):
 * - GET /api/v1/predictions/analytics/me           → /analytics
 * - GET /api/v1/predictions/analytics/users/:username → /analytics/:username
 */
export function getAnalyticsPath(subjectUsername?: string): string {
  if (!subjectUsername) return '/analytics';
  return `/analytics/${encodeURIComponent(subjectUsername)}`;
}
