import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireSupabasePublicConfig } from '@/lib/supabase/publicEnv';

describe('requireSupabasePublicConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns both public values when they are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');

    expect(requireSupabasePublicConfig()).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'publishable-key',
    });
  });

  it('throws when either public value is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');

    expect(() => requireSupabasePublicConfig()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/);
  });
});
