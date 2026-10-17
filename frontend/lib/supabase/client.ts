import { createBrowserClient } from '@supabase/ssr';
import { requireSupabasePublicConfig } from '@/lib/supabase/publicEnv';

export function createClient() {
  const { url, publishableKey } = requireSupabasePublicConfig();
  return createBrowserClient(url, publishableKey);
}
