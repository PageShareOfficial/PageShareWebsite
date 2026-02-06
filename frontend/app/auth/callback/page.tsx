'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiGet } from '@/lib/api/client';

/** User needs onboarding if username is a placeholder (starts with user_) */
function needsOnboarding(username: string): boolean {
  return username.startsWith('user_');
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const handled = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get('code');
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hasHash = hash.length > 0;

    async function redirectWithSession(session: { access_token: string }) {
      if (handled.current) return;
      handled.current = true;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
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
          await redirectWithSession(session);
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
            await redirectWithSession(session);
          }
        }
      );
      subscription = sub;

      // Also check immediately in case session is already set
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await redirectWithSession(session);
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
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
