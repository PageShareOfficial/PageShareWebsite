/**
 * Clamp a datetime into [min, max], or return null when input is missing/invalid.
 */
export function clampDatetimeToWindow(
  value: Date | null,
  min: Date,
  max: Date
): Date | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  if (value.getTime() < min.getTime()) return min;
  if (value.getTime() > max.getTime()) return max;
  return value;
}
