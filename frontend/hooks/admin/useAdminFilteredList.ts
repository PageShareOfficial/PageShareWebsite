'use client';

import { useCallback, useState } from 'react';
import { useAdminPagedList } from '@/hooks/admin/useAdminPagedList';
import type { AdminPage } from '@/lib/api/adminApi';

export type AdminFilteredFetcher<F, T> = (
  accessToken: string,
  page: number,
  filter: F
) => Promise<AdminPage<T>>;

/** Admin list with a filter; changing the filter refetches from page 1. */
export function useAdminFilteredList<F extends string, T extends { id: string }>(
  initialFilter: F,
  fetchForFilter: AdminFilteredFetcher<F, T>
) {
  const [filter, setFilter] = useState<F>(initialFilter);
  const fetchPage = useCallback(
    (accessToken: string, page: number) => fetchForFilter(accessToken, page, filter),
    [fetchForFilter, filter]
  );
  const list = useAdminPagedList(fetchPage);
  const { setPage } = list;

  const changeFilter = useCallback(
    (next: F) => {
      setFilter(next);
      setPage(1);
    },
    [setPage]
  );

  return { ...list, filter, changeFilter };
}
