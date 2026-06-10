/**
 * Client-side daily submission count until backend enforces limits.
 * Uses local calendar date in the user's timezone.
 */

import { MAX_PREDICTIONS_PER_DAY } from '@/utils/predictions/predictionRules';

const STORAGE_KEY = 'pageshare_predictions_daily_count_v1';

type Stored = { dateKey: string; count: number };

function localDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getPredictionsSubmittedToday(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return 0;
    }
    const rec = JSON.parse(raw) as Stored;
    if (rec.dateKey !== localDateKey()) {
      return 0;
    }
    return typeof rec.count === 'number' ? rec.count : 0;
  } catch {
    return 0;
  }
}

export function incrementPredictionsSubmittedToday(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const today = localDateKey();
  const current = getPredictionsSubmittedToday();
  const payload: Stored = { dateKey: today, count: current + 1 };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function canSubmitPredictionToday(): boolean {
  return getPredictionsSubmittedToday() < MAX_PREDICTIONS_PER_DAY;
}
