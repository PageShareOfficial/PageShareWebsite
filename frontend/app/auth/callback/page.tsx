'use client';

import { Suspense,useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiGet, apiPost, getBaseUrl } from '@/lib/api/client';
import Loading from '@/components/app/common/Loading';

/** User needs onboarding if username is a placeholder (starts with user_) */
function needsOnboarding(username: string): boolean {
  return username.startsWith('user_');
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const handled = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get('code');
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hasHash = hash.length > 0;

    async function redirectWithSession(session: { access_token: string }, isNewLogin: boolean) {
      if (handled.current) return;
      handled.current = true;

      const apiUrl = getBaseUrl();
      if (apiUrl) {
        if (isNewLogin) {
          try {
            await apiPost('/session/start', {}, session.access_token);
          } catch {
            // Non-blocking: session tracking best-effort
          }
        }
        try {
          const user = await apiGet<{ username: string }>('/users/me', session.access_token);
          if (needsOnboarding(user.username)) {
            router.replace('/onboarding');
            return;
          }
          router.replace('/home');
          return;
        } catch {
          // Backend unreachable: user likely just confirmed email → send to onboarding
          router.replace('/onboarding');
          return;
        }
      }
      // No API URL: assume new user from email confirmation → onboarding
      router.replace('/onboarding');
    }

    let subscription: { unsubscribe: () => void } | null = null;

    async function run() {
      // PKCE flow: exchange code for session
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus('error');
          router.replace('/?error=auth');
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await redirectWithSession(session, true);
        } else {
          setStatus('error');
          router.replace('/?error=auth');
        }
        return;
      }

      // Hash flow (email confirmation, magic link): Supabase auto-parses hash on init.
      // Listen for auth state change since hash parsing can be async.
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (
            session?.access_token &&
            (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
          ) {
            await redirectWithSession(session, hasHash);
          }
        }
      );
      subscription = sub;

      // Also check immediately in case session is already set
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await redirectWithSession(session, hasHash);
      } else if (!hasHash) {
        // No code, no hash - invalid callback
        setStatus('error');
        router.replace('/?error=auth');
      }
    }

    run();
    return () => subscription?.unsubscribe();
  }, [router, searchParams]);

  if (status === 'error') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loading text="Completing sign in..." />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Loading text="Completing sign in..." />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}