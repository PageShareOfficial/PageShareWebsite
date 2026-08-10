'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingState from '@/components/app/common/LoadingState';
import EmailSignUpForm from './EmailSignUpForm';
import EmailSignInForm from './EmailSignInForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import {  Lock, Shield } from 'lucide-react';

type AuthTab = 'signup' | 'signin';
type AuthView = AuthTab | 'forgot';

interface AuthTabsProps {
  initialError?: string;
}

export default function AuthTabs({ initialError }: AuthTabsProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    const openSignup = () => {
      setView('signup');
      setError(null);
    };
    window.addEventListener('pageshare:open-signup', openSignup);
    return () => window.removeEventListener('pageshare:open-signup', openSignup);
  }, []);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div
      id="auth"
      className="w-full max-w-md rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-[#111827]/90 to-black/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(34,211,238,0.12)] backdrop-blur-sm"
    >
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-cyan-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Welcome to PageShare</h2>
        <p className="text-sm text-gray-500 mt-1.5">
          Create an account to publish predictions or explore analyst track records.
        </p>
      </div>

      {view !== 'forgot' && (
        <div className="flex border-b border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setView('signin'); setError(null); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
              view === 'signin' ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Sign in
            {view === 'signin' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => { setView('signup'); setError(null); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
              view === 'signup' ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Create account
            {view === 'signup' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            )}
          </button>
        </div>
      )}

      {view === 'forgot' && (
        <p className="text-gray-400 text-center text-sm mb-4">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className={view === 'forgot' ? 'min-h-0' : 'min-h-[21.5rem]'}>
        {view === 'forgot' ? (
          <ForgotPasswordForm
            onBack={() => { setView('signin'); setError(null); }}
          />
        ) : view === 'signup' ? (
          <EmailSignUpForm variant="landing" onError={(msg) => setError(msg ?? null)} />
        ) : (
          <EmailSignInForm
            variant="landing"
            onError={(msg) => setError(msg ?? null)}
            onForgotPassword={() => { setView('forgot'); setError(null); }}
          />
        )}
      </div>

      {view !== 'forgot' && (
        <>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#0d1117] text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-xl border border-white/15 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingState text="Connecting..." size="sm" inline />
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </>
      )}

      <div className="flex items-center justify-center gap-2 mt-6 text-[11px] sm:text-xs text-gray-500">
        <Shield className="w-3.5 h-3.5 text-cyan-400/70 shrink-0" />
        <span>Your data is encrypted and always secure.</span>
      </div>
    </div>
  );
}
