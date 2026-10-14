'use client';

import AdminFilterChips, { type AdminFilterOption } from '@/components/app/admin/AdminFilterChips';
import AdminListView from '@/components/app/admin/AdminListView';
import { useAdminFilteredList } from '@/hooks/admin/useAdminFilteredList';
import { useAdminRowAction } from '@/hooks/admin/useAdminRowAction';
import { listErrorLogs, resolveErrorLog, type AdminErrorLog } from '@/lib/api/adminApi';
import { formatRelativeTime } from '@/utils/core/dateUtils';

type ErrorFilter = 'open' | 'resolved' | 'all';

const ERROR_FILTERS: AdminFilterOption<ErrorFilter>[] = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];

const RESOLVED_BY_FILTER: Record<ErrorFilter, boolean | undefined> = {
  open: false,
  resolved: true,
  all: undefined,
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300',
  error: 'bg-orange-500/15 text-orange-300',
  warning: 'bg-amber-500/15 text-amber-300',
};
const DEFAULT_SEVERITY_STYLE = 'bg-white/10 text-gray-300';
const RESOLVE_BUTTON_CLASS =
  'rounded-lg bg-white/5 px-3 py-1.5 text-gray-200 hover:bg-white/10 disabled:opacity-40';

function fetchErrorLogs(accessToken: string, page: number, filter: ErrorFilter) {
  return listErrorLogs(accessToken, { resolved: RESOLVED_BY_FILTER[filter], page });
}

interface ErrorRowProps {
  log: AdminErrorLog;
  isBusy: boolean;
  onResolve: (log: AdminErrorLog) => void;
}

function ErrorRowMeta({ log }: { log: AdminErrorLog }) {
  const severityClass = SEVERITY_STYLES[log.severity] ?? DEFAULT_SEVERITY_STYLE;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-full px-2 py-0.5 font-medium ${severityClass}`}>
        {log.severity}
      </span>
      <span className="rounded-full bg-white/5 px-2 py-0.5 text-gray-300">{log.error_type}</span>
      {log.request_path && <code className="text-gray-400">{log.request_path}</code>}
      <span className="text-gray-500">{formatRelativeTime(log.created_at)}</span>
    </div>
  );
}

function ErrorRow({ log, isBusy, onResolve }: ErrorRowProps) {
  return (
    <li className="space-y-2 rounded-xl border border-white/10 p-4 text-sm">
      <ErrorRowMeta log={log} />
      <p className="break-words text-gray-200">{log.error_message}</p>
      {log.resolved ? (
        <p className="text-xs text-emerald-300">Resolved</p>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onResolve(log)}
          className={RESOLVE_BUTTON_CLASS}
        >
          Mark resolved
        </button>
      )}
    </li>
  );
}

export default function AdminErrorsPanel() {
  const list = useAdminFilteredList<ErrorFilter, AdminErrorLog>('open', fetchErrorLogs);
  const { busyId, actionError, runRowAction } = useAdminRowAction();

  const handleResolve = (log: AdminErrorLog) => {
    const accessToken = list.accessToken;
    if (!accessToken) return;
    void runRowAction(
      log.id,
      async () => {
        await resolveErrorLog(log.id, accessToken);
        list.replaceItem({ ...log, resolved: true, resolved_at: new Date().toISOString() });
      },
      'Could not resolve this error.'
    );
  };

  return (
    <section className="space-y-4">
      <AdminFilterChips
        ariaLabel="Filter error logs"
        options={ERROR_FILTERS}
        value={list.filter}
        onChange={list.changeFilter}
      />
      {actionError && <p className="text-sm text-red-400">{actionError}</p>}
      <AdminListView
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        loadingText="Loading error logs…"
        emptyTitle="No errors"
        emptyDescription="Nothing logged for this filter."
        pagination={list.pagination}
        onRetry={list.reload}
        onPageChange={list.setPage}
      >
        {list.items.map((log) => (
          <ErrorRow
            key={log.id}
            log={log}
            isBusy={busyId === log.id}
            onResolve={handleResolve}
          />
        ))}
      </AdminListView>
    </section>
  );
}
