'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/billing/useSubscription';
import {
  listSavedAnalysts,
  saveAnalystByUsername,
  unsaveAnalystByUsername,
} from '@/lib/api/savedAnalystApi';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import { mapSavedAnalystFromApi } from '@/utils/predictions/mapSavedAnalyst';
import {
  appendSavedAnalyst,
  hasSavedAnalyst,
  removeSavedAnalystByHandle,
  replaceSavedAnalyst,
} from '@/utils/predictions/savedAnalystListUtils';
import type { SavedAnalyst } from '@/types/savedAnalyst';

export interface UseSavedAnalystsResult {
  savedAnalysts: SavedAnalyst[];
  isLoading: boolean;
  loadError: string | null;
  isSaved: (handle: string) => boolean;
  saveAnalyst: (analyst: SavedAnalyst) => Promise<void>;
  removeSavedAnalyst: (handle: string) => Promise<void>;
  toggleSavedAnalyst: (analyst: SavedAnalyst) => Promise<void>;
  refreshSavedAnalysts: () => Promise<void>;
}

const SavedAnalystsContext = createContext<UseSavedAnalystsResult | null>(null);

async function loadSavedAnalystsFromApi(accessToken: string): Promise<SavedAnalyst[]> {
  const response = await listSavedAnalysts(accessToken);
  return response.data.map(mapSavedAnalystFromApi);
}

function useSavedAnalystsState(): UseSavedAnalystsResult {
  const { session, loading: authLoading } = useAuth();
  const { isInvestorPlan, isLoading: subscriptionLoading } = useSubscription();
  const accessToken = session?.access_token;
  const [savedAnalysts, setSavedAnalysts] = useState<SavedAnalyst[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshSavedAnalysts = useCallback(async () => {
    if (!accessToken || !isInvestorPlan) {
      setSavedAnalysts([]);
      setLoadError(null);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      setSavedAnalysts(await loadSavedAnalystsFromApi(accessToken));
    } catch (error) {
      setSavedAnalysts([]);
      setLoadError(getErrorMessage(error, 'Failed to load saved analysts'));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isInvestorPlan]);

  useEffect(() => {
    if (subscriptionLoading || authLoading) {
      return;
    }
    void refreshSavedAnalysts();
  }, [refreshSavedAnalysts, subscriptionLoading, authLoading]);

  const isSaved = useCallback(
    (handle: string) => hasSavedAnalyst(savedAnalysts, handle),
    [savedAnalysts]
  );

  const saveAnalyst = useCallback(
    async (analyst: SavedAnalyst) => {
      if (!accessToken) {
        return;
      }
      let snapshot: SavedAnalyst[] = [];
      let alreadySaved = false;
      setSavedAnalysts((current) => {
        snapshot = current;
        if (hasSavedAnalyst(current, analyst.handle)) {
          alreadySaved = true;
          return current;
        }
        return appendSavedAnalyst(current, analyst);
      });
      if (alreadySaved) {
        return;
      }
      try {
        const saved = mapSavedAnalystFromApi(
          await saveAnalystByUsername(analyst.handle, accessToken)
        );
        setSavedAnalysts((current) => replaceSavedAnalyst(current, saved));
      } catch (error) {
        setSavedAnalysts(snapshot);
        throw error;
      }
    },
    [accessToken]
  );

  const removeSavedAnalyst = useCallback(
    async (handle: string) => {
      if (!accessToken) {
        return;
      }
      let snapshot: SavedAnalyst[] = [];
      setSavedAnalysts((current) => {
        snapshot = current;
        return removeSavedAnalystByHandle(current, handle);
      });
      try {
        await unsaveAnalystByUsername(handle, accessToken);
      } catch (error) {
        setSavedAnalysts(snapshot);
        throw error;
      }
    },
    [accessToken]
  );

  const toggleSavedAnalyst = useCallback(
    async (analyst: SavedAnalyst) => {
      if (isSaved(analyst.handle)) {
        await removeSavedAnalyst(analyst.handle);
        return;
      }
      await saveAnalyst(analyst);
    },
    [isSaved, removeSavedAnalyst, saveAnalyst]
  );

  return useMemo(
    () => ({
      savedAnalysts,
      isLoading,
      loadError,
      isSaved,
      saveAnalyst,
      removeSavedAnalyst,
      toggleSavedAnalyst,
      refreshSavedAnalysts,
    }),
    [
      savedAnalysts,
      isLoading,
      loadError,
      isSaved,
      saveAnalyst,
      removeSavedAnalyst,
      toggleSavedAnalyst,
      refreshSavedAnalysts,
    ]
  );
}

export function SavedAnalystsProvider({ children }: { children: ReactNode }) {
  const value = useSavedAnalystsState();
  return (
    <SavedAnalystsContext.Provider value={value}>{children}</SavedAnalystsContext.Provider>
  );
}

export function useSavedAnalysts(): UseSavedAnalystsResult {
  const context = useContext(SavedAnalystsContext);
  if (!context) {
    throw new Error('useSavedAnalysts must be used within SavedAnalystsProvider');
  }
  return context;
}
