const UNCONFIRMED_EMAIL_MARKERS = ['email not confirmed', 'token_not_found', 'refresh token'];

export const UNCONFIRMED_EMAIL_MESSAGE =
  'Please check your email and click the confirmation link to activate your account, then try signing in again.';

/** Supabase reports an unconfirmed email in several ways; show one actionable message. */
export function toFriendlySignInError(message: string): string {
  const lower = message.toLowerCase();
  return UNCONFIRMED_EMAIL_MARKERS.some((marker) => lower.includes(marker))
    ? UNCONFIRMED_EMAIL_MESSAGE
    : message;
}
