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
import type { SavedAnalyst } from '@/types/savedAnalyst';

interface SavedAnalystsContextValue {
  savedAnalysts: SavedAnalyst[];
  isSaved: (handle: string) => boolean;
  saveAnalyst: (analyst: SavedAnalyst) => void;
  removeSavedAnalyst: (handle: string) => void;
  toggleSavedAnalyst: (analyst: SavedAnalyst) => void;
}

const STORAGE_KEY_PREFIX = 'pageshare_saved_analysts';

const SavedAnalystsContext = createContext<SavedAnalystsContextValue | null>(null);

function readSavedAnalysts(userId: string): SavedAnalyst[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAnalyst[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedAnalysts(userId: string, analysts: SavedAnalyst[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}:${userId}`, JSON.stringify(analysts));
}

export function SavedAnalystsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [savedAnalysts, setSavedAnalysts] = useState<SavedAnalyst[]>([]);

  useEffect(() => {
    if (!userId) {
      setSavedAnalysts([]);
      return;
    }
    setSavedAnalysts(readSavedAnalysts(userId));
  }, [userId]);

  const persist = useCallback(
    (next: SavedAnalyst[]) => {
      setSavedAnalysts(next);
      if (userId) writeSavedAnalysts(userId, next);
    },
    [userId]
  );

  const isSaved = useCallback(
    (handle: string) => savedAnalysts.some((a) => a.handle === handle),
    [savedAnalysts]
  );

  const saveAnalyst = useCallback(
    (analyst: SavedAnalyst) => {
      if (!userId || isSaved(analyst.handle)) return;
      persist([...savedAnalysts, analyst]);
    },
    [isSaved, persist, savedAnalysts, userId]
  );

  const removeSavedAnalyst = useCallback(
    (handle: string) => {
      if (!userId) return;
      persist(savedAnalysts.filter((a) => a.handle !== handle));
    },
    [persist, savedAnalysts, userId]
  );

  const toggleSavedAnalyst = useCallback(
    (analyst: SavedAnalyst) => {
      if (isSaved(analyst.handle)) {
        removeSavedAnalyst(analyst.handle);
        return;
      }
      saveAnalyst(analyst);
    },
    [isSaved, removeSavedAnalyst, saveAnalyst]
  );

  const value = useMemo(
    () => ({
      savedAnalysts,
      isSaved,
      saveAnalyst,
      removeSavedAnalyst,
      toggleSavedAnalyst,
    }),
    [savedAnalysts, isSaved, saveAnalyst, removeSavedAnalyst, toggleSavedAnalyst]
  );

  return (
    <SavedAnalystsContext.Provider value={value}>{children}</SavedAnalystsContext.Provider>
  );
}

export function useSavedAnalysts(): SavedAnalystsContextValue {
  const context = useContext(SavedAnalystsContext);
  if (!context) {
    throw new Error('useSavedAnalysts must be used within SavedAnalystsProvider');
  }
  return context;
}
