'use client';

import { useRouter } from 'next/navigation';
import LoadingState from '@/components/app/common/LoadingState';
import {
  Report,
  getReportedContentPath,
  getReportReasonLabel,
} from '@/utils/content/reportUtils';
import { formatTimeAgo } from '@/utils/core/dateUtils';
import { Inbox } from '@/constants/icons';

function ReportViewButton({
  report,
  onView,
}: {
  report: Report;
  onView: (path: string) => void;
}) {
  const reportedContentPath = getReportedContentPath(report);

  return (
    <button
      type="button"
      onClick={() => {
        if (reportedContentPath) onView(reportedContentPath);
      }}
      disabled={!reportedContentPath}
      title={
        reportedContentPath ? undefined : 'The post for this comment is not available'
      }
      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
    >
      View
    </button>
  );
}

interface ReportHistoryPanelProps {
  reports: Report[];
  loading: boolean;
  error?: string | null;
}

/** Report history list for Settings privacy tab. */
export default function ReportHistoryPanel({
  reports,
  loading,
  error = null,
}: ReportHistoryPanelProps) {
  const router = useRouter();

  if (loading) {
    return <LoadingState text="Loading report history..." />;
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="mb-2 text-lg text-red-300">Could not load reports</p>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Inbox className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <p className="mb-2 text-lg text-gray-300">No reports submitted</p>
        <p className="text-sm text-gray-400">Reports you submit will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">
                  Reported {report.contentType === 'post' ? 'post' : 'comment'}
                </span>
                <span className="text-sm text-gray-400">from</span>
                <span className="font-medium text-cyan-400">
                  @{report.reportedUserHandle}
                </span>
                {report.contentType === 'comment' && report.postId ? (
                  <>
                    <span className="text-sm text-gray-400">on post</span>
                    <span className="font-mono text-sm text-gray-500">
                      {report.postId.substring(0, 8)}...
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mb-2 text-sm text-gray-500">
                {formatTimeAgo(report.timestamp)}
              </div>
            </div>
            <ReportViewButton report={report} onView={(path) => router.push(path)} />
          </div>
          <div className="border-t border-white/10 pt-2">
            <div className="mb-1 text-sm text-gray-400">Reason:</div>
            <div className="font-medium text-white">
              {getReportReasonLabel(report.reason)}
            </div>
            {report.description ? (
              <div className="mt-2 text-sm text-gray-400">{report.description}</div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
