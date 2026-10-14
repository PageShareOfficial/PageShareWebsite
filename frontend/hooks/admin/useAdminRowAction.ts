'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

/** Runs one row action at a time, tracking which row is busy and surfacing failures. */
export function useAdminRowAction() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runRowAction = useCallback(
    async (rowId: string, action: () => Promise<void>, fallbackMessage: string) => {
      setBusyId(rowId);
      setActionError(null);
      try {
        await action();
      } catch (err) {
        setActionError(getErrorMessage(err, fallbackMessage));
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  return { busyId, actionError, runRowAction };
}
