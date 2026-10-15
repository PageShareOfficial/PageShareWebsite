import { apiGet, apiPatch, apiPost } from '@/lib/api/client';

export type AdminReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type AdminReportReviewStatus = Exclude<AdminReportStatus, 'pending'>;

export interface AdminReport {
  id: string;
  status: AdminReportStatus;
  report_type: string;
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reporter_username: string | null;
  content_type: 'post' | 'comment' | 'user';
  content_id: string | null;
  post_id: string | null;
  content_preview: string | null;
  content_deleted: boolean;
  target_username: string | null;
}

export interface AdminPagination {
  page: number;
  per_page: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AdminPage<T> {
  data: T[];
  pagination: AdminPagination;
}

export interface MetricsDashboard {
  user_metrics: {
    dau: number;
    mau: number;
    total_users: number;
    new_signups: Record<string, number>;
  };
  engagement_metrics: {
    total_posts: number;
    total_comments: number;
    total_reactions: number;
    total_reposts: number;
  };
  growth_metrics: {
    user_growth: Record<string, number>;
    content_growth: Record<string, number>;
  };
  platform_health: {
    errors: Record<string, number>;
  };
  timestamp: string | null;
}

export interface AdminErrorLog {
  id: string;
  error_type: string;
  error_code: string | null;
  error_message: string;
  severity: string;
  user_id: string | null;
  request_path: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function listAdminReports(
  accessToken: string,
  options: { status?: AdminReportStatus; page?: number } = {}
): Promise<AdminPage<AdminReport>> {
  const query = buildQuery({ status: options.status, page: options.page ?? 1 });
  return apiGet<AdminPage<AdminReport>>(`/admin/reports${query}`, accessToken);
}

export async function updateAdminReportStatus(
  reportId: string,
  status: AdminReportReviewStatus,
  accessToken: string
): Promise<AdminReport> {
  const res = await apiPatch<{ data: AdminReport }>(
    `/admin/reports/${reportId}`,
    { status },
    accessToken
  );
  return res.data;
}

export async function removeReportedContent(
  reportId: string,
  accessToken: string
): Promise<AdminReport> {
  const res = await apiPost<{ data: AdminReport }>(
    `/admin/reports/${reportId}/remove-content`,
    undefined,
    accessToken
  );
  return res.data;
}

export async function getMetricsDashboard(accessToken: string): Promise<MetricsDashboard> {
  const res = await apiGet<{ data: MetricsDashboard }>('/metrics/dashboard', accessToken);
  return res.data;
}

export function listErrorLogs(
  accessToken: string,
  options: { resolved?: boolean; page?: number } = {}
): Promise<AdminPage<AdminErrorLog>> {
  const query = buildQuery({ resolved: options.resolved, page: options.page ?? 1 });
  return apiGet<AdminPage<AdminErrorLog>>(`/errors${query}`, accessToken);
}

export async function resolveErrorLog(errorId: string, accessToken: string): Promise<void> {
  await apiPatch(`/errors/${errorId}/resolve`, undefined, accessToken);
}
