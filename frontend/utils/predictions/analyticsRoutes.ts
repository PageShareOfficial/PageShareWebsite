/**
 * Analytics URL helpers.
 *
 * API alignment (planned):
 * - GET /api/v1/predictions/analytics/me           → /analytics
 * - GET /api/v1/predictions/analytics/users/:username → /analytics/:username
 */

export type AnalyticsTabId = 'dashboard' | 'predictions';

export const ANALYTICS_TAB_QUERY = 'tab';
export const ANALYTICS_CALL_QUERY = 'call';

export function parseAnalyticsTabParam(
  value: string | null | undefined
): AnalyticsTabId {
  return value === 'predictions' ? 'predictions' : 'dashboard';
}

export interface AnalyticsPathOptions {
  tab?: AnalyticsTabId;
  callId?: string | null;
}

export function getAnalyticsPath(
  subjectUsername?: string,
  options?: AnalyticsTabId | AnalyticsPathOptions
): string {
  const normalized: AnalyticsPathOptions =
    options === 'dashboard' || options === 'predictions'
      ? { tab: options }
      : (options ?? {});

  const base = !subjectUsername
    ? '/analytics'
    : `/analytics/${encodeURIComponent(subjectUsername)}`;

  const params = new URLSearchParams();
  if (normalized.tab === 'predictions') {
    params.set(ANALYTICS_TAB_QUERY, 'predictions');
  }
  if (normalized.callId?.trim()) {
    params.set(ANALYTICS_CALL_QUERY, normalized.callId.trim());
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
