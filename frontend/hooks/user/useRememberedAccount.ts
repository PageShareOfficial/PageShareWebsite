'use client';

import { useEffect, useState } from 'react';
import { readRememberedAccount, type RememberedAccount } from '@/utils/auth/rememberedAccount';

/** Reads the remembered account after mount (localStorage is unavailable during SSR). */
export function useRememberedAccount(): RememberedAccount | null {
  const [account, setAccount] = useState<RememberedAccount | null>(null);

  useEffect(() => {
    setAccount(readRememberedAccount());
  }, []);

  return account;
}
