'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormInput from '@/components/app/common/FormInput';
import { PrimaryButton } from '@/components/app/common/Button';
import LoadingState from '@/components/app/common/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface EmailSignInFormProps {
  onError?: (message: string | null) => void;
  onForgotPassword?: () => void;
}

export default function EmailSignInForm({ onError, onForgotPassword }: EmailSignInFormProps) {
  const { signInWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    onError?.(null);
    try {
      await signInWithEmail(data.email, data.password);
      // After successful sign-in, navigate to home.
      // Home (and middleware) will handle redirect to onboarding if needed.
      router.push('/home');
    } catch (err) {
      let msg = getErrorMessage(err, 'Sign in failed');
      // Map Supabase auth errors to user-friendly messages
      const lower = msg.toLowerCase();
      if (lower.includes('email not confirmed') || lower.includes('token_not_found') || lower.includes('refresh token')) {
        msg = 'Please check your email and click the confirmation link to activate your account, then try signing in again.';
      }
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <FormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>
      <div>
        <FormInput
          label="Password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="mt-1 text-sm text-cyan-400 hover:underline"
          >
            Forgot password?
          </button>
        )}
      </div>
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
    </form>
  );
}
