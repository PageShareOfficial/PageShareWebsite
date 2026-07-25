import type {
  PredictionAnalyticsDetail,
  PredictionIndexItem,
} from '@/lib/api/predictionApi';

const STORAGE_PREFIX = 'pageshare:analytics-predictions:';

export interface AnalyticsPredictionsCacheSnapshot {
  indexItems: PredictionIndexItem[];
  detailsById: Record<string, PredictionAnalyticsDetail>;
  selectedId: string | null;
  savedAt: number;
}

function cacheStorageKey(subjectUsername: string): string {
  const scope = subjectUsername.trim() || '__me__';
  return `${STORAGE_PREFIX}${scope}`;
}

export function readAnalyticsPredictionsCache(
  subjectUsername: string
): AnalyticsPredictionsCacheSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(cacheStorageKey(subjectUsername));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AnalyticsPredictionsCacheSnapshot;
    if (!Array.isArray(parsed.indexItems)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeAnalyticsPredictionsCache(
  subjectUsername: string,
  snapshot: Omit<AnalyticsPredictionsCacheSnapshot, 'savedAt'>
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(
      cacheStorageKey(subjectUsername),
      JSON.stringify({ ...snapshot, savedAt: Date.now() })
    );
  } catch {
    // ignore quota / private mode
  }
}
