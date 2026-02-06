'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LoadingState from '@/components/app/common/LoadingState';
import EmailSignUpForm from './EmailSignUpForm';
import EmailSignInForm from './EmailSignInForm';
import ForgotPasswordForm from './ForgotPasswordForm';

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

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
    <div className="w-full max-w-lg bg-black p-6 sm:p-8 md:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Welcome to PageShare
      </h1>

      {view !== 'forgot' && (
        <div className="flex rounded-full bg-gray-900/80 p-1 mt-6 mb-6">
          <button
            type="button"
            onClick={() => { setView('signup'); setError(null); }}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              view === 'signup' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => { setView('signin'); setError(null); }}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              view === 'signin' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign in
          </button>
        </div>
      )}

      {view === 'forgot' && (
        <p className="text-gray-400 text-center text-sm mt-2 mb-4">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {view === 'forgot' ? (
        <ForgotPasswordForm
          onBack={() => { setView('signin'); setError(null); }}
        />
      ) : view === 'signup' ? (
        <EmailSignUpForm onError={(msg) => setError(msg ?? null)} />
      ) : (
        <EmailSignInForm
          onError={(msg) => setError(msg ?? null)}
          onForgotPassword={() => { setView('forgot'); setError(null); }}
        />
      )}

      {view !== 'forgot' && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-black text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full px-6 py-3.5 bg-white rounded-full text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <LoadingState text="Connecting..." size="sm" inline className="text-gray-900" />
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <p className="text-sm text-gray-400 text-center mt-4 mb-6">
            {view === 'signup' ? "We'll create your account automatically." : 'New here? Sign up above.'}
          </p>
        </>
      )}

      <p className="text-[10px] sm:text-xs text-gray-500 text-center leading-relaxed px-2">
        By continuing, you agree to the{" "}
        <Link href="/terms" className="text-cyan-400 hover:underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
        , including{" "}
        <Link href="/cookies" className="text-cyan-400 hover:underline">Cookie Use</Link>.
      </p>
    </div>
  );
}
