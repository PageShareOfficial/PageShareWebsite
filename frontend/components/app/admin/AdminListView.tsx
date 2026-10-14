'use client';

import type { ReactNode } from 'react';
import AdminPager from '@/components/app/admin/AdminPager';
import EmptyState from '@/components/app/common/EmptyState';
import ErrorState from '@/components/app/common/ErrorState';
import LoadingState from '@/components/app/common/LoadingState';
import type { AdminPagination } from '@/lib/api/adminApi';

interface AdminListViewProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  loadingText: string;
  emptyTitle: string;
  emptyDescription: string;
  pagination: AdminPagination | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  children: ReactNode;
}

function AdminListContent(props: AdminListViewProps) {
  if (props.loading) return <LoadingState text={props.loadingText} />;
  if (props.error) return <ErrorState message={props.error} onRetry={props.onRetry} />;
  if (props.isEmpty) {
    return <EmptyState title={props.emptyTitle} description={props.emptyDescription} />;
  }
  return <ul className="space-y-3">{props.children}</ul>;
}

/** Loading / error / empty / list states plus pagination for admin lists. */
export default function AdminListView(props: AdminListViewProps) {
  return (
    <>
      <AdminListContent {...props} />
      <AdminPager pagination={props.pagination} onPageChange={props.onPageChange} />
    </>
  );
}
