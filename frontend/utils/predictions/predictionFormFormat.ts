import { getErrorMessage } from '@/utils/error/getErrorMessage';

/** Format a percent change for prediction trade-level cards. */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Map live-price API failures to a short UI message. */
export function formatAssetPriceError(error: unknown): string {
  const message = getErrorMessage(error, 'Failed to load live price');
  if (message === 'NotFound') {
    return 'Asset not found';
  }
  return message;
}
