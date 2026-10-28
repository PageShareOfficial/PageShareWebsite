'use client';

import { useEffect, useState } from 'react';
import { listMyReports, type ReportHistoryItemResponse } from '@/lib/api/reportApi';
import {
  Report,
  isAutoHideReportedEnabled,
  toReportReason,
} from '@/utils/content/reportUtils';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

function mapApiReportToReport(
  item: ReportHistoryItemResponse,
  reporterHandle: string
): Report | null {
  if (item.content_type !== 'post' && item.content_type !== 'comment') {
    return null;
  }
  return {
    id: item.id,
    contentType: item.content_type === 'comment' ? 'comment' : 'post',
    contentId: item.content_id,
    postId: item.post_id ?? undefined,
    reportedUserHandle: item.reported_user_handle,
    reporterHandle,
    reason: toReportReason(item.reason),
    description: item.description ?? undefined,
    timestamp: item.created_at,
  };
}

/**
 * Loads the current user's report history and auto-hide preference.
 */
export function useMyReports(
  accessToken: string | undefined,
  reporterHandle: string | undefined,
  enabled = true
) {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [autoHideReported, setAutoHideReported] = useState(false);

  useEffect(() => {
    if (!enabled || !reporterHandle || !accessToken) return;

    let cancelled = false;

    const loadData = async () => {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const apiReports = await listMyReports(accessToken);
        if (cancelled) return;

        const mapped = apiReports
          .map((item) => mapApiReportToReport(item, reporterHandle))
          .filter((report): report is Report => report !== null);

        setReports(mapped);
        setAutoHideReported(isAutoHideReportedEnabled(reporterHandle));
      } catch (error) {
        if (!cancelled) {
          const message = getErrorMessage(error, 'Failed to load report history');
          console.error('Failed to load report history:', message);
          setReports([]);
          setReportsError(message);
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    };

    void loadData();

    const handleAutoHideUpdated = () => {
      setAutoHideReported(isAutoHideReportedEnabled(reporterHandle));
    };

    window.addEventListener('autoHideReportedUpdated', handleAutoHideUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('autoHideReportedUpdated', handleAutoHideUpdated);
    };
  }, [enabled, reporterHandle, accessToken]);

  return {
    reports,
    reportsLoading,
    reportsError,
    autoHideReported,
    setAutoHideReported,
  };
}
