'use client';

import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import LoadingState from '@/components/app/common/LoadingState';
import type { RememberedAccount } from '@/utils/auth/rememberedAccount';
import EmailSignInForm from './EmailSignInForm';
import GoogleIcon from './GoogleIcon';
import AuthErrorBanner from './AuthErrorBanner';

type ReturningAccountSignInProps = Readonly<{
  account: RememberedAccount;
  error: string | null;
  isGoogleLoading: boolean;
  onContinueWithGoogle: () => void;
  onError: (message: string | null) => void;
  onForgotPassword: () => void;
}>;

const METHOD_LABEL: Record<RememberedAccount['method'], string> = {
  google: 'Signed in with Google',
  email: 'Signed in with email',
};

/** Focused sign-in for the account last used on this browser. */
export default function ReturningAccountSignIn({
  account,
  error,
  isGoogleLoading,
  onContinueWithGoogle,
  onError,
  onForgotPassword,
}: ReturningAccountSignInProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center text-center mb-6">
        <AvatarWithFallback
          src={account.avatarUrl ?? undefined}
          alt={account.displayName}
          size={80}
          className="mb-3"
        />
        <p className="text-lg font-semibold text-white truncate max-w-full">
          {account.displayName}
        </p>
        <p className="text-sm text-gray-400 truncate max-w-full">{account.email}</p>
        <p className="text-xs text-gray-500 mt-1">{METHOD_LABEL[account.method]}</p>
      </div>

      <AuthErrorBanner message={error} />
      {account.method === 'google' ? (
        <button
          type="button"
          onClick={onContinueWithGoogle}
          disabled={isGoogleLoading}
          className="w-full py-3.5 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          {isGoogleLoading ? (
            <LoadingState text="Connecting..." size="sm" inline className="text-black" />
          ) : (
            <>
              <GoogleIcon />
              Continue
            </>
          )}
        </button>
      ) : (
        <EmailSignInForm
          variant="landing"
          defaultEmail={account.email}
          onError={onError}
          onForgotPassword={onForgotPassword}
        />
      )}
    </div>
  );
}
