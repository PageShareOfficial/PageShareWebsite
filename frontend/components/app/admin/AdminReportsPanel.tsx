'use client';

import AdminFilterChips, { type AdminFilterOption } from '@/components/app/admin/AdminFilterChips';
import AdminListView from '@/components/app/admin/AdminListView';
import AdminReportCard, { type AdminReportAction } from '@/components/app/admin/AdminReportCard';
import { useAdminFilteredList } from '@/hooks/admin/useAdminFilteredList';
import { useAdminRowAction } from '@/hooks/admin/useAdminRowAction';
import {
  listAdminReports,
  removeReportedContent,
  updateAdminReportStatus,
  type AdminReport,
  type AdminReportStatus,
} from '@/lib/api/adminApi';

type ReportFilter = AdminReportStatus | 'all';

const REPORT_FILTERS: AdminFilterOption<ReportFilter>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'all', label: 'All' },
];

function fetchReports(accessToken: string, page: number, filter: ReportFilter) {
  return listAdminReports(accessToken, { status: filter === 'all' ? undefined : filter, page });
}

function confirmAction(report: AdminReport, action: AdminReportAction): boolean {
  return action !== 'remove' || window.confirm(`Delete this ${report.content_type}?`);
}

export default function AdminReportsPanel() {
  const list = useAdminFilteredList<ReportFilter, AdminReport>('pending', fetchReports);
  const { busyId, actionError, runRowAction } = useAdminRowAction();

  const handleAction = (report: AdminReport, action: AdminReportAction) => {
    const accessToken = list.accessToken;
    if (!accessToken || !confirmAction(report, action)) return;
    void runRowAction(
      report.id,
      async () => {
        if (action === 'remove') {
          await removeReportedContent(report.id, accessToken);
          list.reload();
          return;
        }
        const status = action === 'dismiss' ? 'dismissed' : 'resolved';
        list.replaceItem(await updateAdminReportStatus(report.id, status, accessToken));
      },
      'Could not update this report.'
    );
  };

  return (
    <section className="space-y-4">
      <AdminFilterChips
        ariaLabel="Filter reports by status"
        options={REPORT_FILTERS}
        value={list.filter}
        onChange={list.changeFilter}
      />
      {actionError && <p className="text-sm text-red-400">{actionError}</p>}
      <AdminListView
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        loadingText="Loading reports…"
        emptyTitle="No reports here"
        emptyDescription="Nothing needs your attention."
        pagination={list.pagination}
        onRetry={list.reload}
        onPageChange={list.setPage}
      >
        {list.items.map((report) => (
          <AdminReportCard
            key={report.id}
            report={report}
            isBusy={busyId === report.id}
            onAction={handleAction}
          />
        ))}
      </AdminListView>
    </section>
  );
}
