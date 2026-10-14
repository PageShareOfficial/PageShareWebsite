'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminPage, AdminPagination } from '@/lib/api/adminApi';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

export type AdminPageFetcher<T> = (accessToken: string, page: number) => Promise<AdminPage<T>>;

/**
 * Loads one page of an admin list. Pass a memoised `fetchPage`; changing it (e.g. a new
 * filter) refetches, and the caller should reset to page 1 at the same time.
 */
export function useAdminPagedList<T extends { id: string }>(fetchPage: AdminPageFetcher<T>) {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<AdminPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(accessToken, page)
      .then((result) => {
        if (cancelled) return;
        setItems(result.data);
        setPagination(result.pagination);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load this list.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, fetchPage, page, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const replaceItem = useCallback((updated: T) => {
    setItems((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  return { items, pagination, page, setPage, loading, error, reload, replaceItem, accessToken };
}
