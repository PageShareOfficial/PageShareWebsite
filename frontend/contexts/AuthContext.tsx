'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { apiGet, apiPost, getBaseUrl } from '@/lib/api/client';
import { clearFeedCache } from '@/lib/feedCache';
import { ROUTES } from '@/constants/routes';
import {
  ACCOUNT_LOAD_ERROR_MESSAGE,
  reportAccountLoadFailure,
} from '@/utils/auth/accountLoadError';
import { buildRememberedAccount, saveRememberedAccount } from '@/utils/auth/rememberedAccount';
import { recordSessionStart } from '@/utils/auth/postAuthRedirect';

export interface BackendUser {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  profile_picture_url?: string | null;
  subscription_plan_id?: string | null;
  timezone?: string | null;
  country?: string | null;
  country_code?: string | null;
  created_at: string;
  updated_at: string;
  stats?: {
    follower_count: number;
    following_count: number;
    post_count: number;
  };
}

interface AuthContextValue {
  user: SupabaseUser | null;
  session: Session | null;
  backendUser: BackendUser | null;
  /** Set when GET /users/me failed; pages show a retry (refreshBackendUser) instead of guessing. */
  backendUserError: string | null;
  loading: boolean;
  /** loginHint pre-selects that Google account (skips the account chooser). */
  signInWithGoogle: (options?: { loginHint?: string }) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<Session | null>;
  signInWithEmail: (email: string, password: string) => Promise<Session | null>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshBackendUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [backendUserError, setBackendUserError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const clearBackendUser = useCallback(() => {
    setBackendUser(null);
    setBackendUserError(null);
  }, []);

  const loadBackendUser = useCallback(
    async (token: string) => {
      if (!getBaseUrl()) {
        clearBackendUser();
        return;
      }
      try {
        setBackendUser(await apiGet<BackendUser>('/users/me', token));
        setBackendUserError(null);
      } catch (err) {
        setBackendUser(null);
        setBackendUserError(ACCOUNT_LOAD_ERROR_MESSAGE);
        reportAccountLoadFailure(err, 'auth_context');
      }
    },
    [clearBackendUser]
  );

  const refreshBackendUser = useCallback(async () => {
    if (!session?.access_token) {
      clearBackendUser();
      return;
    }
    await loadBackendUser(session.access_token);
  }, [session?.access_token, loadBackendUser, clearBackendUser]);

  // Only fetch backend user when on a protected/app route (not on landing /)
  // Prevents 401s from firing before login when /[username] or other routes prefetch
  const shouldFetchBackend = pathname && pathname !== '/';

  // Skip fetch when we already have backendUser for the same session (reduces API calls on nav)
  const needsFetch = useCallback(
    (session: Session | null) => {
      if (!session?.access_token || !shouldFetchBackend) return false;
      return !backendUser || backendUser.id !== session.user.id;
    },
    [shouldFetchBackend, backendUser]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.access_token || !shouldFetchBackend) {
        clearBackendUser();
      } else if (needsFetch(session)) {
        await loadBackendUser(session.access_token);
      }

      setLoading(false);
    });

    // Get initial session – keep loading true until backend user fetch completes (if needed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.access_token || !shouldFetchBackend) {
        clearBackendUser();
        setLoading(false);
      } else if (needsFetch(session)) {
        loadBackendUser(session.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, loadBackendUser, clearBackendUser, shouldFetchBackend, needsFetch]);

  // When navigating from / to a protected route, fetch backend user (only if we don't have it)
  useEffect(() => {
    if (!shouldFetchBackend || !session?.access_token || !needsFetch(session)) {
      return;
    }
    setLoading(true);
    loadBackendUser(session.access_token).finally(() => setLoading(false));
  }, [shouldFetchBackend, session, needsFetch, loadBackendUser]);

  // Session start: idempotent - creates session if none active (e.g. returning user, new visit)
  useEffect(() => {
    if (session?.access_token && getBaseUrl()) {
      void recordSessionStart(session.access_token);
    }
  }, [session?.access_token]);

  // Remember who signed in on this browser so the landing page can offer "Continue as …"
  useEffect(() => {
    if (!session?.user || !backendUser) return;
    const account = buildRememberedAccount(session.user, backendUser);
    if (account) saveRememberedAccount(account);
  }, [session?.user, backendUser]);

  const signInWithGoogle = useCallback(
    async (options?: { loginHint?: string }) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(options?.loginHint && { queryParams: { login_hint: options.loginHint } }),
        },
      });
      if (error) throw error;
    },
    [supabase.auth]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return data.session;
    },
    [supabase.auth]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data.session;
    },
    [supabase.auth]
  );

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
    },
    [supabase.auth]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    [supabase.auth]
  );

  const signOut = useCallback(async () => {
    clearFeedCache();
    if (session?.access_token) {
      try {
        await apiPost('/session/end', {}, session.access_token);
      } catch {
        // Non-blocking: session end best-effort
      }
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearBackendUser();
    router.replace(ROUTES.landing);
  }, [supabase.auth, router, session?.access_token, clearBackendUser]);

  const value: AuthContextValue = {
    user,
    session,
    backendUser,
    backendUserError,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    updatePassword,
    signOut,
    refreshBackendUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
