'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

// Interests options
const interestsOptions = [
  'Stocks',
  'ETFs',
  'NFTs',
  'Crypto',
  'Options',
  'Futures',
  'Forex',
  'Commodities',
  'Bonds',
  'Mutual Funds',
];

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
    
    // Combine Google data with form data
    // Note: country and timezone should be auto-detected from IP or Google Auth
    const onboardingPayload = {
      ...googleUserData,
      ...data,
      // These will be set by backend from IP geolocation or Google Auth
      // country: autoDetectedCountry,
      // timezone: autoDetectedTimezone,
    };

    // TODO: Send to backend API
    console.log('Onboarding data:', onboardingPayload);
    
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
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              {...register('username', {
                onChange: (e) => {
                  e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                },
              })}
              type="text"
              id="username"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
              Display Name <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              {...register('displayName')}
              type="text"
              id="displayName"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Display name"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-300 mb-2">
              Date of Birth <span className="text-red-400">*</span>
            </label>
            <input
              {...register('dob')}
              type="date"
              id="dob"
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            {errors.dob && (
              <p className="mt-1 text-sm text-red-400">{errors.dob.message}</p>
            )}
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
            {errors.bio && (
              <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
            )}
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
            {errors.interests && (
              <p className="mt-2 text-sm text-red-400">{errors.interests.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3.5 bg-white rounded-full text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

