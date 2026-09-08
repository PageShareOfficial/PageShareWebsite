'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import Loading from '@/components/app/common/Loading';
import { resolvePostAuthPath } from '@/utils/auth/postAuthRedirect';

const SESSION_WAIT_MS = 8000;

async function waitForAuthSession(
  supabase: SupabaseClient,
  timeoutMs: number
): Promise<Session | null> {
  const {
    data: { session: initialSession },
  } = await supabase.auth.getSession();
  if (initialSession?.access_token) {
    return initialSession;
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      resolve(session);
    };

    const timeoutId = window.setTimeout(() => finish(null), timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session?.access_token &&
        (event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED')
      ) {
        finish(session);
      }
    });
  });
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

    async function completeSignIn(session: Session, recordSessionStart: boolean) {
      if (handled.current) return;
      handled.current = true;

      const destination = await resolvePostAuthPath(session.access_token, {
        recordSessionStart,
      });
      router.replace(destination);
    }

    async function failAuth() {
      if (handled.current) return;
      handled.current = true;
      setStatus('error');
      router.replace('/?error=auth');
    }

    async function run() {
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          await failAuth();
          return;
        }

        const session =
          data.session ?? (await waitForAuthSession(supabase, SESSION_WAIT_MS));
        if (session?.access_token) {
          await completeSignIn(session, true);
          return;
        }

        await failAuth();
        return;
      }

      const session = await waitForAuthSession(
        supabase,
        hasHash ? SESSION_WAIT_MS : 2000
      );
      if (session?.access_token) {
        await completeSignIn(session, hasHash);
        return;
      }

      await failAuth();
    }

    void run();
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
