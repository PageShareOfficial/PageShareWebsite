import { apiGet, apiPost } from '@/lib/api/client';

export type BackendReportType =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'inappropriate_content'
  | 'other';

export interface CreateReportBody {
  reported_post_id?: string | null;
  reported_comment_id?: string | null;
  reported_user_id?: string | null;
  report_type: BackendReportType;
  reason?: string | null;
}

export interface ReportResponse {
  id: string;
  status: string;
  created_at: string;
}

export interface CreateReportResponse {
  data: ReportResponse;
}

export interface ReportHistoryItemResponse {
  id: string;
  content_type: 'post' | 'comment' | 'user';
  content_id: string;
  post_id?: string | null;
  reported_user_handle: string;
  reason: string;
  description?: string | null;
  created_at: string;
}

export interface ListReportsApiResponse {
  data: {
    reports: ReportHistoryItemResponse[];
  };
}

export async function createReport(
  body: CreateReportBody,
  accessToken: string
): Promise<ReportResponse> {
  const res = await apiPost<CreateReportResponse>('/reports', body, accessToken);
  return res.data;
}

export async function listMyReports(accessToken: string): Promise<ReportHistoryItemResponse[]> {
  const res = await apiGet<ListReportsApiResponse>('/reports', accessToken);
  return res.data.reports;
}
