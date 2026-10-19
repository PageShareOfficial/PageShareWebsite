export interface SaleTimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Time remaining until `endsAt`. Null when the instant has passed or is invalid. */
export function saleTimeLeft(endsAt: string, nowMs: number): SaleTimeLeft | null {
  const endMs = new Date(endsAt).getTime();
  if (Number.isNaN(endMs)) return null;
  const remainingMs = endMs - nowMs;
  if (remainingMs <= 0) return null;
  return {
    days: Math.floor(remainingMs / DAY_MS),
    hours: Math.floor((remainingMs % DAY_MS) / HOUR_MS),
    minutes: Math.floor((remainingMs % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((remainingMs % MINUTE_MS) / SECOND_MS),
  };
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Clock for one strip face.
 * Upcoming phases count down to the start. The live phase counts down to the end.
 */
export function saleFaceClock(
  startsAt: string,
  endsAt: string,
  nowMs: number
): string | null {
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  if (nowMs < startMs) {
    const untilStart = saleTimeLeft(startsAt, nowMs);
    return untilStart ? `starts in ${formatSaleCountdown(untilStart)}` : null;
  }
  if (nowMs < endMs) {
    const untilEnd = saleTimeLeft(endsAt, nowMs);
    return untilEnd ? `${formatSaleCountdown(untilEnd)} left` : null;
  }
  return null;
}

/** `12d 04h 15m 09s` */
export function formatSaleCountdown(remaining: SaleTimeLeft): string {
  const hours = twoDigits(remaining.hours);
  const minutes = twoDigits(remaining.minutes);
  const seconds = twoDigits(remaining.seconds);
  return `${remaining.days}d ${hours}h ${minutes}m ${seconds}s`;
}
