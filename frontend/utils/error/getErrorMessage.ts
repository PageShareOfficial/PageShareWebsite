/**
 * Extract a user-facing error message from an unknown caught value.
 * Use for consistent, safe error handling in catch blocks (DRY).
 *
 * @param error - Caught value (Error, string, or unknown)
 * @param fallback - Message to show when no clear message can be derived
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message?.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return fallback;
}
