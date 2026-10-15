'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  forgetRememberedAccount,
  readRememberedAccount,
  type RememberedAccount,
} from '@/utils/auth/rememberedAccount';

interface RememberedAccountState {
  account: RememberedAccount | null;
  /** Removes the hint from this browser (e.g. "Not you?") and hides it immediately. */
  forgetAccount: () => void;
}

/** Reads the remembered account after mount (localStorage is unavailable during SSR). */
export function useRememberedAccount(): RememberedAccountState {
  const [account, setAccount] = useState<RememberedAccount | null>(null);

  useEffect(() => {
    setAccount(readRememberedAccount());
  }, []);

  const forgetAccount = useCallback(() => {
    forgetRememberedAccount();
    setAccount(null);
  }, []);

  return { account, forgetAccount };
}
