/**
 * Client-side rules for prediction validation (must be mirrored in backend).
 */

export const LOCK_DURATION_MS = 2 * 60 * 1000;
export const MIN_EXPIRY_OFFSET_MS = 30 * 60 * 1000;
export const MAX_EXPIRY_OFFSET_MS = 2 * 24 * 60 * 60 * 1000;
export const MIN_RISK_REWARD = 1.2;
export const MIN_TARGET_MOVE_PCT = 0.01;
export const MIN_STOP_MOVE_PCT = 0.005;
export const MAX_PREDICTIONS_PER_DAY = 5;
export const MAX_THESIS_LENGTH = 300;
export const MIN_CONFIDENCE = 0.5;
export const MAX_CONFIDENCE = 0.95;
export const MAX_THESIS_IMAGES = 1;
export const THESIS_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

export function computeRiskReward(entry: number, target: number, stop: number): number {
  const denom = entry - stop;
  if (Math.abs(denom) < 1e-12) {
    return Number.NaN;
  }
  return (target - entry) / denom;
}

export function validatePositionSides(
  position: 'long' | 'short',
  entry: number,
  target: number,
  stop: number
): string | null {
  if (position === 'long') {
    if (!(target > entry && stop < entry)) {
      return 'For a long: target must be above entry, stop loss below entry.';
    }
  } else if (!(target < entry && stop > entry)) {
    return 'For a short: target must be below entry, stop loss above entry.';
  }
  return null;
}

export function validatePriceDistance(entry: number, target: number, stop: number): string | null {
  const minTargetMove = MIN_TARGET_MOVE_PCT * entry;
  const minStopMove = MIN_STOP_MOVE_PCT * entry;
  if (Math.abs(target - entry) < minTargetMove) {
    return `Target must be at least 1% from entry (≥ $${minTargetMove.toFixed(4)} move).`;
  }
  if (Math.abs(stop - entry) < minStopMove) {
    return `Stop loss must be at least 0.5% from entry (≥ $${minStopMove.toFixed(4)} move).`;
  }
  return null;
}

export function validateRiskReward(entry: number, target: number, stop: number): string | null {
  const rr = computeRiskReward(entry, target, stop);
  if (Number.isNaN(rr)) {
    return 'Entry and stop loss cannot be equal.';
  }
  if (rr < MIN_RISK_REWARD) {
    return `Risk-reward must be ≥ ${MIN_RISK_REWARD} ( yours is ${rr.toFixed(2)} ).`;
  }
  return null;
}
