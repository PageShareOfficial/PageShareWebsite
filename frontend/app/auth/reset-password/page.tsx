'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import FormInput from '@/components/app/common/FormInput';
import Loading from '@/components/app/common/Loading';
import { PrimaryButton } from '@/components/app/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // Redirect if no session after loading (invalid/expired link)
  useEffect(() => {
    if (!loading && !session) {
      router.replace('/?error=reset_expired');
    }
  }, [loading, session, router]);

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await updatePassword(data.password);
      setSuccess(true);
      setTimeout(() => router.push('/home'), 2000);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update password'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loading />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Password updated</h1>
          <p className="text-gray-400 mb-4">Redirecting you to home...</p>
          <div className="h-1 w-24 mx-auto bg-cyan-500/30 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-lg bg-black p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
          Set new password
        </h1>
        <p className="text-gray-400 text-center text-sm mb-6">
          Enter your new password below.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <FormInput
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <PrimaryButton
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-full text-gray-900 font-semibold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update password'}
          </PrimaryButton>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          <Link href="/" className="text-cyan-400 hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
