'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormInput from '@/components/app/common/FormInput';
import LandingFormInput from '@/components/auth/LandingFormInput';
import { PrimaryButton } from '@/components/app/common/Button';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import LoadingState from '@/components/app/common/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import { resolvePostAuthPath } from '@/utils/auth/postAuthRedirect';
import SignUpTermsNotice from '@/components/auth/SignUpTermsNotice';

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
  variant?: 'default' | 'landing';
  onError?: (message: string | null) => void;
}

export default function EmailSignUpForm({
  variant = 'default',
  onError,
}: EmailSignUpFormProps) {
  const { signUpWithEmail } = useAuth();
  const router = useRouter();
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
      const session = await signUpWithEmail(data.email, data.password);
      if (session?.access_token) {
        const destination = await resolvePostAuthPath(session.access_token, {
          recordSessionStart: true,
        });
        router.replace(destination);
        return;
      }
      setSuccessMessage('Check your email to confirm your account.');
    } catch (err) {
      const msg = getErrorMessage(err, 'Sign up failed');
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isLanding = variant === 'landing';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {successMessage && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 text-sm">
          {successMessage}
        </div>
      )}
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
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon={<Lock className="w-4 h-4" />}
            showPasswordToggle
            error={errors.password?.message}
            {...register('password')}
          />
        ) : (
          <FormInput
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
        )}
      </div>
      <div>
        {isLanding ? (
          <LandingFormInput
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            icon={<Lock className="w-4 h-4" />}
            showPasswordToggle
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        ) : (
          <FormInput
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        )}
        <SignUpTermsNotice className="mt-3" />
      </div>
      {isLanding ? (
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          {isLoading ? (
            <LoadingState text="Creating account..." size="sm" inline className="text-black" />
          ) : (
            <>
              Create account
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
            <LoadingState text="Creating account..." size="sm" inline className="text-gray-900" />
          ) : (
            'Sign up'
          )}
        </PrimaryButton>
      )}
    </form>
  );
}
