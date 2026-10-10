'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormInput from '@/components/app/common/FormInput';
import LandingFormInput from '@/components/auth/LandingFormInput';
import { PrimaryButton } from '@/components/app/common/Button';
import { ArrowRight, Lock, Mail } from '@/constants/icons';
import LoadingState from '@/components/app/common/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import { resolvePostAuthPath } from '@/utils/auth/postAuthRedirect';
import { toFriendlySignInError } from '@/utils/auth/signInErrors';
import { ROUTES } from '@/constants/routes';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface EmailSignInFormProps {
  variant?: 'default' | 'landing';
  onError?: (message: string | null) => void;
  onForgotPassword?: () => void;
  /** Pre-fills the email (e.g. remembered account) and focuses the password field. */
  defaultEmail?: string;
}

export default function EmailSignInForm({
  variant = 'default',
  onError,
  onForgotPassword,
  defaultEmail,
}: EmailSignInFormProps) {
  const { signInWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: defaultEmail ?? '' },
  });

  useEffect(() => {
    if (defaultEmail) setFocus('password');
  }, [defaultEmail, setFocus]);

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    onError?.(null);
    try {
      const session = await signInWithEmail(data.email, data.password);
      if (session?.access_token) {
        const destination = await resolvePostAuthPath(session.access_token, {
          recordSessionStart: true,
        });
        router.replace(destination);
      } else {
        router.replace(ROUTES.home);
      }
    } catch (err) {
      onError?.(toFriendlySignInError(getErrorMessage(err, 'Sign in failed')));
    } finally {
      setIsLoading(false);
    }
  };

  const isLanding = variant === 'landing';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        {isLanding ? (
          <LandingFormInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
        ) : (
          <FormInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        )}
      </div>
      <div>
        {isLanding ? (
          <LandingFormInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            icon={<Lock className="w-4 h-4" />}
            showPasswordToggle
            error={errors.password?.message}
            {...register('password')}
          />
        ) : (
          <FormInput
            label="Password"
            type="password"
            placeholder="Your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        )}
        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="mt-1.5 text-sm text-cyan-400 hover:underline"
          >
            Forgot password?
          </button>
        )}
      </div>
      {isLanding ? (
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          {isLoading ? (
            <LoadingState text="Signing in..." size="sm" inline className="text-black" />
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      ) : (
        <PrimaryButton
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-full text-gray-900 font-semibold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <LoadingState text="Signing in..." size="sm" inline className="text-gray-900" />
          ) : (
            'Sign in'
          )}
        </PrimaryButton>
      )}
    </form>
  );
}
