import { saveToStorage } from '@/utils/core/storageUtils';

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

const REPORTS_KEY = 'pageshare_reports';

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
export const reportContent = (
  report: Omit<Report, 'id' | 'timestamp'>
): void => {
  if (typeof window === 'undefined') return;

  const newReport: Report = {
    ...report,
    id: `report_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
  };

  const allReports = getReports();
  allReports.push(newReport);
  
  saveToStorage(REPORTS_KEY, allReports);
  
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
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(REPORTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading reports from localStorage:', error);
  }

  return [];
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
  if (typeof window === 'undefined') return false;
  
  try {
    const saved = localStorage.getItem(`pageshare_auto_hide_reported_${userHandle}`);
    if (saved === null) {
      // Default to true if not set
      return true;
    }
    return JSON.parse(saved) === true;
  } catch {
    return true; // Default to true on error
  }
};

/**
 * Toggle auto-hide reported content setting
 */
export const toggleAutoHideReported = (userHandle: string): void => {
  if (typeof window === 'undefined') return;
  
  const current = isAutoHideReportedEnabled(userHandle);
  localStorage.setItem(
    `pageshare_auto_hide_reported_${userHandle}`,
    JSON.stringify(!current)
  );
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new Event('autoHideReportedUpdated'));
};

