/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useAdminFilteredList,
  type AdminFilteredFetcher,
} from '@/hooks/admin/useAdminFilteredList';
import { useAdminRowAction } from '@/hooks/admin/useAdminRowAction';
import type { AdminPage } from '@/lib/api/adminApi';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ session: { access_token: 'token-123' } }),
}));

type Row = { id: string; label: string };
type Filter = 'open' | 'resolved';

function renderList(fetcher: AdminFilteredFetcher<Filter, Row>) {
  return renderHook(() => useAdminFilteredList<Filter, Row>('open', fetcher));
}

function pageOf(rows: Row[], page = 1): AdminPage<Row> {
  return {
    data: rows,
    pagination: { page, per_page: 20, total: rows.length, has_next: false, has_prev: page > 1 },
  };
}

describe('useAdminFilteredList', () => {
  it('loads the first page for the initial filter', async () => {
    const fetcher = vi.fn().mockResolvedValue(pageOf([{ id: 'a', label: 'A' }]));
    const { result } = renderList(fetcher);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([{ id: 'a', label: 'A' }]);
    expect(fetcher).toHaveBeenCalledWith('token-123', 1, 'open');
  });

  it('refetches from page 1 when the filter changes', async () => {
    const fetcher = vi.fn().mockResolvedValue(pageOf([]));
    const { result } = renderList(fetcher);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(fetcher).toHaveBeenLastCalledWith('token-123', 3, 'open'));
    act(() => result.current.changeFilter('resolved'));

    await waitFor(() => expect(fetcher).toHaveBeenLastCalledWith('token-123', 1, 'resolved'));
    expect(result.current.page).toBe(1);
  });

  it('surfaces fetch failures as an error message', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Admin access required'));
    const { result } = renderList(fetcher);

    await waitFor(() => expect(result.current.error).toBe('Admin access required'));
    expect(result.current.items).toEqual([]);
  });

  it('replaces a single row in place', async () => {
    const fetcher = vi.fn().mockResolvedValue(pageOf([{ id: 'a', label: 'old' }]));
    const { result } = renderList(fetcher);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.replaceItem({ id: 'a', label: 'new' }));
    expect(result.current.items).toEqual([{ id: 'a', label: 'new' }]);
  });
});

describe('useAdminRowAction', () => {
  it('clears the busy row after a successful action', async () => {
    const { result } = renderHook(() => useAdminRowAction());
    await act(() => result.current.runRowAction('row-1', async () => {}, 'fallback'));

    expect(result.current.busyId).toBeNull();
    expect(result.current.actionError).toBeNull();
  });

  it('reports the error message when the action fails', async () => {
    const { result } = renderHook(() => useAdminRowAction());
    const failing = async () => {
      throw new Error('Report not found');
    };
    await act(() => result.current.runRowAction('row-1', failing, 'fallback'));

    expect(result.current.actionError).toBe('Report not found');
    expect(result.current.busyId).toBeNull();
  });
});
