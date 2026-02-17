'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormInput from '@/components/app/common/FormInput';
import { PrimaryButton } from '@/components/app/common/Button';
import LoadingState from '@/components/app/common/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

const signUpSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

interface EmailSignUpFormProps {
  onError?: (message: string | null) => void;
}

export default function EmailSignUpForm({ onError }: EmailSignUpFormProps) {
  const { signUpWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    onError?.(null);
    setSuccessMessage(null);
    try {
      await signUpWithEmail(data.email, data.password);
      setSuccessMessage('Check your email to confirm your account.');
    } catch (err) {
      const msg = getErrorMessage(err, 'Sign up failed');
      onError?.(msg);
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>
      <div>
        <FormInput
          label="Confirm password"
          type="password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      <PrimaryButton
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-full text-gray-900 font-semibold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <LoadingState text="Creating account..." size="sm" inline className="text-gray-900" />
        ) : (
          'Sign up'
        )}
      </PrimaryButton>
    </form>
  );
}
