/** Supabase SSR stores the session as `sb-<project-ref>-auth-token`, optionally chunked (`.0`, `.1`). */
const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-.+-auth-token(\.\d+)?$/;

/**
 * True when the request carries a Supabase session cookie. This is only a rendering hint
 * (which layout to stream first); the proxy and backend still verify the session itself.
 */
export function hasSupabaseAuthCookie(cookieNames: readonly string[]): boolean {
  return cookieNames.some((name) => SUPABASE_AUTH_COOKIE_PATTERN.test(name));
}
