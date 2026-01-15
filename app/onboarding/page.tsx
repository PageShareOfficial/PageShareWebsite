'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { interestsOptions } from '@/utils/core/constants';
import FormInput from '@/components/app/common/FormInput';
import FormErrorMessage from '@/components/app/common/FormErrorMessage';
import { PrimaryButton } from '@/components/app/common/Button';

// Form validation schema
const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  displayName: z.string().optional(),
  dob: z.string().refine((val) => {
    if (!val) return false;
    const birthDate = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    return actualAge >= 18;
  }, 'You must be at least 18 years old'),
  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(200, 'Bio must not exceed 200 characters'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // In real implementation, get this from Google OAuth response or session
  const [googleUserData] = useState({
    name: 'John Doe',
    email: 'john@gmail.com',
    picture: '', // Google profile picture URL
  });

  // Generate username suggestion from name
  const generateUsernameSuggestion = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 20) || 'user';
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: googleUserData.name,
      interests: [],
    },
  });

  const selectedInterests = watch('interests') || [];

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    
    // Auto-detect timezone from browser
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Combine Google data with form data
    // Note: country should be auto-detected from IP on backend
    const onboardingPayload = {
      ...googleUserData,
      ...data,
      timezone: detectedTimezone, // Auto-detected from browser
      // country will be set by backend from IP geolocation
    };

    // TODO: Send to backend API
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Redirect to feed after successful onboarding
    // router.push('/feed');

    setIsSubmitting(false);
  };

  const suggestedUsername = generateUsernameSuggestion(googleUserData.name);

  const toggleInterest = (interest: string) => {
    const current = selectedInterests;
    if (current.includes(interest)) {
      setValue('interests', current.filter((i) => i !== interest));
    } else {
      setValue('interests', [...current, interest]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to PageShare!
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username */}
          <div>
            <FormInput
              label={
                <>
                  Username <span className="text-red-400">*</span>
                </>
              }
              id="username"
              placeholder="Username"
              {...register('username', {
                onChange: (e) => {
                  e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                },
              })}
            />
            <FormErrorMessage message={errors.username?.message} className="mt-1" />
          </div>

          {/* Display Name */}
          <div>
            <FormInput
              label={
                <>
                  Display Name <span className="text-gray-500 text-xs">(optional)</span>
                </>
              }
              id="displayName"
              placeholder="Display name"
              {...register('displayName')}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <FormInput
              label={
                <>
                  Date of Birth <span className="text-red-400">*</span>
                </>
              }
              id="dob"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...register('dob')}
            />
            <FormErrorMessage message={errors.dob?.message} className="mt-1" />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
              Bio <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register('bio')}
              id="bio"
              rows={4}
              maxLength={200}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
            <FormErrorMessage message={errors.bio?.message} className="mt-1" />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {watch('bio')?.length || 0}/200 characters
            </p>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Interests <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {interestsOptions.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-500 text-white'
                        : 'bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            <FormErrorMessage message={errors.interests?.message} className="mt-2" />
          </div>

          {/* Submit Button */}
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full text-gray-900 font-semibold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Continue'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}

