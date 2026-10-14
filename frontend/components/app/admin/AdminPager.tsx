'use client';

import { ChevronLeft, ChevronRight } from '@/constants/icons';
import type { AdminPagination } from '@/lib/api/adminApi';

interface AdminPagerProps {
  pagination: AdminPagination | null;
  onPageChange: (page: number) => void;
}

const PAGER_BUTTON_CLASS =
  'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-200 ' +
  'hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';

export default function AdminPager({ pagination, onPageChange }: AdminPagerProps) {
  if (!pagination || (!pagination.has_next && !pagination.has_prev)) {
    return null;
  }
  const { page, total } = pagination;

  return (
    <div className="flex items-center justify-between pt-4 text-sm text-gray-400">
      <span>
        Page {page} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={PAGER_BUTTON_CLASS}
          disabled={!pagination.has_prev}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button
          type="button"
          className={PAGER_BUTTON_CLASS}
          disabled={!pagination.has_next}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
