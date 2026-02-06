'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormInput from '@/components/app/common/FormInput';
import { PrimaryButton } from '@/components/app/common/Button';
import LoadingState from '@/components/app/common/LoadingState';
import { useAuth } from '@/contexts/AuthContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await resetPassword(data.email);
      setSuccessMessage('Check your email for the reset link.');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {successMessage && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      <div>
        <FormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
        />
      </div>
      <PrimaryButton
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-full text-gray-900 font-semibold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <LoadingState text="Sending..." size="sm" inline className="text-gray-900" />
        ) : (
          'Send reset link'
        )}
      </PrimaryButton>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to sign in
        </button>
      )}
    </form>
  );
}
