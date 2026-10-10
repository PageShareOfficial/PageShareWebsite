'use client';

import { useState } from 'react';
import Link from 'next/link';
import ErrorState from '@/components/app/common/ErrorState';
import { ROUTES } from '@/constants/routes';
import { ACCOUNT_LOAD_ERROR_MESSAGE } from '@/utils/auth/accountLoadError';

type AccountLoadErrorViewProps = Readonly<{
  onRetry: () => Promise<void>;
  className?: string;
}>;

/** Shown when GET /users/me fails, instead of guessing onboarding or spinning forever. */
export default function AccountLoadErrorView({
  onRetry,
  className = '',
}: AccountLoadErrorViewProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center bg-black p-4 ${className}`}>
      <ErrorState
        title="Couldn't load your account"
        message={ACCOUNT_LOAD_ERROR_MESSAGE}
        onRetry={() => void handleRetry()}
        retryDisabled={retrying}
        actionLabel={retrying ? 'Retrying...' : 'Try again'}
      />
      <Link href={ROUTES.landing} className="text-sm text-[#1d9bf0] hover:underline">
        Back to home
      </Link>
    </div>
  );
}
