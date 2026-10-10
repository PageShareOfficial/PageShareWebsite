'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingState from '@/components/app/common/LoadingState';
import EmailSignUpForm from './EmailSignUpForm';
import EmailSignInForm from './EmailSignInForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import GoogleIcon from './GoogleIcon';
import ReturningAccountSignIn from './ReturningAccountSignIn';
import AuthErrorBanner from './AuthErrorBanner';
import { useRememberedAccount } from '@/hooks/user/useRememberedAccount';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import { Lock, Shield } from '@/constants/icons';

type AuthView = 'signin' | 'signup' | 'forgot';

const HEADINGS: Record<AuthView, { title: string; subtitle: string }> = {
  signin: {
    title: 'Welcome to PageShare',
    subtitle: 'Sign in to publish predictions or explore analyst track records.',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Publish predictions or explore analyst track records.',
  },
  forgot: {
    title: 'Reset your password',
    subtitle: "Enter your email and we'll send you a reset link.",
  },
};

const RETURNING_HEADING = { title: 'Welcome back', subtitle: '' };

function AuthHeading({
  title,
  subtitle,
  showIcon,
}: Readonly<{
  title: string;
  subtitle: string;
  showIcon: boolean;
}>) {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      {showIcon && (
        <div className="w-12 h-12 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-cyan-400" />
        </div>
      )}
      <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>}
    </div>
  );
}

function SecurityNote() {
  return (
    <div className="flex items-center justify-center gap-2 mt-6 text-[11px] sm:text-xs text-gray-500">
      <Shield className="w-3.5 h-3.5 text-cyan-400/70 shrink-0" />
      <span>Your data is encrypted and always secure.</span>
    </div>
  );
}

function GoogleAuthSection({
  isLoading,
  onClick,
}: Readonly<{
  isLoading: boolean;
  onClick: () => void;
}>) {
  return (
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
        onClick={onClick}
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
  );
}

const MODE_SWITCH: Partial<Record<AuthView, { prompt: string; action: string; target: AuthView }>> =
  {
    signin: { prompt: 'New here?', action: 'Create account', target: 'signup' },
    signup: { prompt: 'Already have an account?', action: 'Sign in', target: 'signin' },
  };

function AuthModeSwitch({
  view,
  onSwitch,
}: Readonly<{
  view: AuthView;
  onSwitch: (nextView: AuthView) => void;
}>) {
  const modeSwitch = MODE_SWITCH[view];
  if (!modeSwitch) return null;
  return (
    <p className="mt-5 text-center text-sm text-gray-500">
      {modeSwitch.prompt}{' '}
      <button
        type="button"
        onClick={() => onSwitch(modeSwitch.target)}
        className="text-cyan-400 font-medium hover:underline"
      >
        {modeSwitch.action}
      </button>
    </p>
  );
}

interface AuthTabsProps {
  initialError?: string;
}

export default function AuthTabs({ initialError }: AuthTabsProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const { signInWithGoogle } = useAuth();
  const rememberedAccount = useRememberedAccount();
  const isReturningView = Boolean(rememberedAccount) && view === 'signin';

  const switchView = (nextView: AuthView) => {
    setView(nextView);
    setError(null);
  };

  useEffect(() => {
    const openSignup = () => {
      if (isReturningView) return;
      setView('signup');
      setError(null);
    };
    window.addEventListener('pageshare:open-signup', openSignup);
    return () => window.removeEventListener('pageshare:open-signup', openSignup);
  }, [isReturningView]);

  const handleGoogleAuth = async (loginHint?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle({ loginHint });
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const heading = isReturningView ? RETURNING_HEADING : HEADINGS[view];

  return (
    <div
      id="auth"
      className="w-full max-w-md rounded-2xl border border-cyan-500/25 bg-linear-to-b from-[#111827]/90 to-black/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(34,211,238,0.12)] backdrop-blur-xs"
    >
      <AuthHeading {...heading} showIcon={!isReturningView} />

      {isReturningView && rememberedAccount ? (
        <ReturningAccountSignIn
          account={rememberedAccount}
          error={error}
          isGoogleLoading={isLoading}
          onContinueWithGoogle={() => void handleGoogleAuth(rememberedAccount.email)}
          onError={setError}
          onForgotPassword={() => switchView('forgot')}
        />
      ) : (
        <>
          <AuthErrorBanner message={error} />

          {view === 'forgot' && <ForgotPasswordForm onBack={() => switchView('signin')} />}
          {view === 'signup' && <EmailSignUpForm variant="landing" onError={setError} />}
          {view === 'signin' && (
            <EmailSignInForm
              variant="landing"
              onError={setError}
              onForgotPassword={() => switchView('forgot')}
            />
          )}

          {view !== 'forgot' && (
            <GoogleAuthSection isLoading={isLoading} onClick={() => void handleGoogleAuth()} />
          )}
        </>
      )}

      {!isReturningView && <AuthModeSwitch view={view} onSwitch={switchView} />}
      <SecurityNote />
    </div>
  );
}
