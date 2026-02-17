import { createReport, type BackendReportType } from '@/lib/api/reportApi';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'inappropriate_content'
  | 'other';

export interface Report {
  id: string;
  contentType: 'post' | 'comment';
  contentId: string;
  postId?: string; // For comments, the ID of the post the comment belongs to
  reportedUserHandle: string;
  reporterHandle: string;
  reason: ReportReason;
  description?: string; // For 'other' reason
  timestamp: string;
}

// In-memory cache of reports made in this session.
// Backend remains the source of truth; this is only for client-side UX (auto-hide).
const inMemoryReports: Report[] = [];

// In-memory toggle for "auto-hide reported content" per user handle (default true).
const autoHideReportedByUser = new Map<string, boolean>();

/**
 * Get all report reason options with labels
 */
export const getReportReasons = (): { value: ReportReason; label: string }[] => {
  return [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech or symbols' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'other', label: 'Other' },
  ];
};

/**
 * Report content (post or comment)
 */
export const reportContent = async (
  report: Omit<Report, 'id' | 'timestamp'> & { reportedUserId?: string | null },
  accessToken: string
): Promise<void> => {
  if (typeof window === 'undefined') return;

  // 1) Call backend /reports (backend is source of truth)
  const body = {
    reported_post_id: report.contentType === 'post' ? report.contentId : undefined,
    reported_comment_id: report.contentType === 'comment' ? report.contentId : undefined,
    reported_user_id: report.reportedUserId ?? undefined,
    report_type: (report.reason as BackendReportType) ?? 'other',
    reason: report.description,
  };

  await createReport(body, accessToken);

  // 2) Maintain local auto-hide UX by recording report in localStorage
  const newReport: Report = {
    contentType: report.contentType,
    contentId: report.contentId,
    postId: report.postId,
    reportedUserHandle: report.reportedUserHandle,
    reporterHandle: report.reporterHandle,
    reason: report.reason,
    description: report.description,
    id: `report_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
  };

  inMemoryReports.push(newReport);
  // Dispatch custom event for real-time updates
  window.dispatchEvent(new Event('reportsUpdated'));
};

/**
 * Filter out reported comments for a user (if auto-hide is enabled)
 */
export const filterReportedComments = (
  comments: any[],
  reporterHandle: string
): any[] => {
  if (typeof window === 'undefined') return comments;
  
  if (!isAutoHideReportedEnabled(reporterHandle)) {
    return comments;
  }
  
  const reportedCommentIds = getReportedContentIds('comment', reporterHandle);
  if (reportedCommentIds.length === 0) return comments;
  
  return comments.filter((comment) => !reportedCommentIds.includes(comment.id));
};

/**
 * Filter out reported posts for a user (if auto-hide is enabled)
 */
export const filterReportedPosts = (
  posts: any[],
  reporterHandle: string
): any[] => {
  if (typeof window === 'undefined') return posts;
  
  if (!isAutoHideReportedEnabled(reporterHandle)) {
    return posts;
  }
  
  const reportedPostIds = getReportedContentIds('post', reporterHandle);
  if (reportedPostIds.length === 0) return posts;
  
  return posts.filter((post) => !reportedPostIds.includes(post.id));
};

/**
 * Get all reports (for admin/settings view)
 */
export const getReports = (): Report[] => {
  return inMemoryReports;
};

/**
 * Get reports made by a specific user
 */
export const getReportsByUser = (userHandle: string): Report[] => {
  const allReports = getReports();
  return allReports.filter((report) => report.reporterHandle === userHandle);
};

/**
 * Check if a specific content (post or comment) is reported by a user
 */
export const isContentReported = (
  contentType: 'post' | 'comment',
  contentId: string,
  reporterHandle: string
): boolean => {
  if (typeof window === 'undefined') return false;
  
  const reports = getReports();
  return reports.some(
    (report) =>
      report.contentType === contentType &&
      report.contentId === contentId &&
      report.reporterHandle === reporterHandle
  );
};

/**
 * Get all content IDs reported by a user (for filtering)
 */
export const getReportedContentIds = (
  contentType: 'post' | 'comment',
  reporterHandle: string
): string[] => {
  if (typeof window === 'undefined') return [];
  
  const reports = getReports();
  return reports
    .filter(
      (report) =>
        report.contentType === contentType && report.reporterHandle === reporterHandle
    )
    .map((report) => report.contentId);
};

/**
 * Check if auto-hide reported content is enabled
 */
export const isAutoHideReportedEnabled = (userHandle: string): boolean => {
  if (!userHandle) return false;
  if (!autoHideReportedByUser.has(userHandle)) {
    // Default to true if not set
    autoHideReportedByUser.set(userHandle, true);
  }
  return autoHideReportedByUser.get(userHandle) === true;
};

/**
 * Toggle auto-hide reported content setting
 */
export const toggleAutoHideReported = (userHandle: string): void => {
  if (!userHandle) return;

  const current = isAutoHideReportedEnabled(userHandle);
  autoHideReportedByUser.set(userHandle, !current);

  // Dispatch event for real-time updates
  window.dispatchEvent(new Event('autoHideReportedUpdated'));
};

