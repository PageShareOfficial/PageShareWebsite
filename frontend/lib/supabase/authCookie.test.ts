import { describe, expect, it } from 'vitest';
import { hasSupabaseAuthCookie } from '@/lib/supabase/authCookie';

describe('hasSupabaseAuthCookie', () => {
  it('detects a single or chunked Supabase session cookie', () => {
    expect(hasSupabaseAuthCookie(['sb-abcd1234-auth-token'])).toBe(true);
    expect(hasSupabaseAuthCookie(['theme', 'sb-abcd1234-auth-token.0'])).toBe(true);
  });

  it('ignores unrelated cookies', () => {
    expect(hasSupabaseAuthCookie([])).toBe(false);
    expect(hasSupabaseAuthCookie(['theme', 'sb-abcd1234-auth-token-code-verifier'])).toBe(false);
    expect(hasSupabaseAuthCookie(['auth-token', 'my-sb-x-auth-token'])).toBe(false);
  });
});
