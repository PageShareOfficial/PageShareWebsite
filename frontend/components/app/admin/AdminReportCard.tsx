'use client';

import Link from 'next/link';
import { ExternalLink } from '@/constants/icons';
import { postPath, profilePath } from '@/constants/routes';
import type { AdminReport } from '@/lib/api/adminApi';
import { formatRelativeTime } from '@/utils/core/dateUtils';

export type AdminReportAction = 'dismiss' | 'resolve' | 'remove';

interface AdminReportCardProps {
  report: AdminReport;
  isBusy: boolean;
  onAction: (report: AdminReport, action: AdminReportAction) => void;
}

const STATUS_STYLES: Record<AdminReport['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  reviewed: 'bg-sky-500/15 text-sky-300',
  resolved: 'bg-emerald-500/15 text-emerald-300',
  dismissed: 'bg-white/10 text-gray-300',
};

export function getReportTargetHref(report: AdminReport): string | null {
  if (!report.target_username || report.content_deleted) return null;
  if (report.content_type === 'user') return profilePath(report.target_username);
  if (!report.post_id) return null;
  const commentId = report.content_type === 'comment' ? report.content_id ?? undefined : undefined;
  return postPath(report.target_username, report.post_id, commentId);
}

function ReportMeta({ report }: { report: AdminReport }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[report.status]}`}>
        {report.status}
      </span>
      <span className="rounded-full bg-white/5 px-2 py-0.5 text-gray-300">
        {report.content_type}
      </span>
      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-300">
        {report.report_type.replace(/_/g, ' ')}
      </span>
      <span className="text-gray-500">{formatRelativeTime(report.created_at)}</span>
    </div>
  );
}

const UNKNOWN_USER = 'unknown';
const PREVIEW_STYLE =
  'whitespace-pre-wrap break-words rounded-lg border border-white/10 ' +
  'bg-white/[0.03] p-3 text-gray-200';

function ReportParties({ report }: { report: AdminReport }) {
  const href = getReportTargetHref(report);
  const reporter = report.reporter_username ?? UNKNOWN_USER;
  const target = report.target_username ?? UNKNOWN_USER;
  return (
    <p className="text-gray-400">
      <span className="text-gray-200">@{reporter}</span> reported{' '}
      <span className="text-gray-200">@{target}</span>
      {href && (
        <Link
          href={href}
          target="_blank"
          className="ml-2 inline-flex items-center gap-1 text-violet-300 hover:underline"
        >
          View <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </p>
  );
}

function ReportBody({ report }: { report: AdminReport }) {
  return (
    <div className="space-y-2 text-sm">
      <ReportParties report={report} />
      {report.content_preview && (
        <blockquote className={PREVIEW_STYLE}>{report.content_preview}</blockquote>
      )}
      {report.content_deleted && (
        <p className="text-xs text-gray-500">Content already removed.</p>
      )}
      {report.reason && <p className="text-gray-400">“{report.reason}”</p>}
    </div>
  );
}

const ACTION_BUTTON_BASE =
  'rounded-lg px-3 py-1.5 text-sm transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-40';
const NEUTRAL_ACTION_STYLE = 'bg-white/5 text-gray-200 hover:bg-white/10';
const DANGER_ACTION_STYLE = 'bg-red-500/15 text-red-300 hover:bg-red-500/25';

interface ActionButtonProps {
  label: string;
  disabled: boolean;
  danger?: boolean;
  onClick: () => void;
}

function ActionButton({ label, disabled, danger = false, onClick }: ActionButtonProps) {
  const style = danger ? DANGER_ACTION_STYLE : NEUTRAL_ACTION_STYLE;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${ACTION_BUTTON_BASE} ${style}`}
    >
      {label}
    </button>
  );
}

export function canRemoveReportedContent(report: AdminReport): boolean {
  return report.content_type !== 'user' && !report.content_deleted;
}

function ReportActions({ report, isBusy, onAction }: AdminReportCardProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        label="Dismiss"
        disabled={isBusy || report.status === 'dismissed'}
        onClick={() => onAction(report, 'dismiss')}
      />
      <ActionButton
        label="Mark resolved"
        disabled={isBusy || report.status === 'resolved'}
        onClick={() => onAction(report, 'resolve')}
      />
      {canRemoveReportedContent(report) && (
        <ActionButton
          label={`Delete ${report.content_type}`}
          disabled={isBusy}
          danger
          onClick={() => onAction(report, 'remove')}
        />
      )}
    </div>
  );
}

export default function AdminReportCard(props: AdminReportCardProps) {
  return (
    <li className="space-y-3 rounded-xl border border-white/10 p-4">
      <ReportMeta report={props.report} />
      <ReportBody report={props.report} />
      <ReportActions {...props} />
    </li>
  );
}
