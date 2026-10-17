'use client';

import { useRouter } from 'next/navigation';
import AccountLoadErrorView from '@/components/auth/AccountLoadErrorView';
import { AUTH_ERROR_CODES, landingWithError } from '@/constants/routes';
import { createClient } from '@/lib/supabase/client';
import { AccountLoadError } from '@/utils/auth/accountLoadError';
import { resolvePostAuthPath } from '@/utils/auth/postAuthRedirect';

/** Retry after the server callback exchanged the code but could not load /users/me. */
export default function AccountErrorPage() {
  const router = useRouter();

  const retry = async () => {
    const destination = await destinationAfterRetry();
    if (destination) router.replace(destination);
  };

  return <AccountLoadErrorView onRetry={retry} className="min-h-screen" />;
}

/** Null keeps the retry view up. AccountLoadError is already reported by the profile lookup. */
async function destinationAfterRetry(): Promise<string | null> {
  try {
    const accessToken = await readAccessToken();
    if (!accessToken) return landingWithError(AUTH_ERROR_CODES.auth);
    return await resolvePostAuthPath(accessToken);
  } catch (err) {
    if (err instanceof AccountLoadError) return null;
    console.error('[auth/account-error] retry failed', err);
    return null;
  }
}

async function readAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
