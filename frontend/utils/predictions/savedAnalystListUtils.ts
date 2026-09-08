import type { SavedAnalyst } from '@/types/savedAnalyst';

export function hasSavedAnalyst(analysts: SavedAnalyst[], handle: string): boolean {
  return analysts.some((analyst) => analyst.handle === handle);
}

export function appendSavedAnalyst(
  analysts: SavedAnalyst[],
  analyst: SavedAnalyst
): SavedAnalyst[] {
  if (hasSavedAnalyst(analysts, analyst.handle)) {
    return analysts;
  }
  return [...analysts, analyst];
}

export function removeSavedAnalystByHandle(
  analysts: SavedAnalyst[],
  handle: string
): SavedAnalyst[] {
  return analysts.filter((analyst) => analyst.handle !== handle);
}

export function replaceSavedAnalyst(
  analysts: SavedAnalyst[],
  saved: SavedAnalyst
): SavedAnalyst[] {
  const without = removeSavedAnalystByHandle(analysts, saved.handle);
  return [...without, saved];
}
