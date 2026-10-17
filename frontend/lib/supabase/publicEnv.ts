export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

/** Reads the public Supabase env. Throws when either value is missing so callers fail loudly. */
export function requireSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }
  return { url, publishableKey };
}
