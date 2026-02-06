'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera } from 'lucide-react';
import { interestsOptions } from '@/utils/core/constants';
import FormInput from '@/components/app/common/FormInput';
import FormErrorMessage from '@/components/app/common/FormErrorMessage';
import { PrimaryButton } from '@/components/app/common/Button';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost, apiUploadProfilePicture } from '@/lib/api/client';
import Loading from '@/components/app/common/Loading';
import LoadingState from '@/components/app/common/LoadingState';

// Form validation schema
const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
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

function needsOnboarding(username: string): boolean {
  return username.startsWith('user_');
}

export default function OnboardingPage() {
  const router = useRouter();
  const { session, backendUser, loading, refreshBackendUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get display name from Google user
  const displayName = session?.user?.user_metadata?.full_name ?? session?.user?.user_metadata?.name ?? '';

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
      displayName: displayName || '',
      interests: [],
    },
  });

  // Update displayName when session loads
  useEffect(() => {
    if (displayName) {
      setValue('displayName', displayName);
    }
  }, [displayName, setValue]);

  const selectedInterests = watch('interests') || [];

  const onSubmit = async (data: OnboardingFormData) => {
    if (!session?.access_token) {
      setSubmitError('Session expired. Please sign in again.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Upload profile picture first if selected
      if (profileImage) {
        await apiUploadProfilePicture(profileImage, session.access_token);
      }

      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Use Google OAuth avatar when user didn't upload a new photo
      const googleAvatar =
        session?.user?.user_metadata?.avatar_url ?? session?.user?.user_metadata?.picture ?? null;

      const payload = {
        username: data.username.toLowerCase(),
        display_name: data.displayName,
        bio: data.bio,
        date_of_birth: data.dob,
        interests: data.interests,
        timezone: detectedTimezone,
        ...(googleAvatar && !profileImage && { profile_picture_url: googleAvatar }),
      };

      await apiPost('/users/me/onboarding', payload, session.access_token);
      await refreshBackendUser();
      router.push('/home');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Onboarding failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already onboarded (middleware protects /onboarding, but user could have completed in another tab)
  useEffect(() => {
    if (loading) return;
    if (!session) return;
    if (backendUser && !needsOnboarding(backendUser.username)) {
      router.replace('/home');
    }
  }, [loading, session, backendUser, router]);

  const suggestedUsername = generateUsernameSuggestion(displayName || 'user');

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB.');
      return;
    }

    setUploadError(null);
    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    setProfilePreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleInterest = (interest: string) => {
    const current = selectedInterests;
    if (current.includes(interest)) {
      setValue('interests', current.filter((i) => i !== interest));
    } else {
      setValue('interests', [...current, interest]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to PageShare!
          </h1>
        </div>

        {submitError && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-white/20 hover:border-teal-500/50 transition-colors flex items-center justify-center bg-white/5"
                aria-label="Upload profile picture"
              >
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AvatarWithFallback
                    src={backendUser?.profile_picture_url ?? session?.user?.user_metadata?.avatar_url}
                    alt={displayName || 'You'}
                    size={112}
                    fallbackText={displayName?.slice(0, 2).toUpperCase() || '?'}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProfileImageSelect}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-sm text-gray-400">
              {profileImage ? (
                <>
                  <span className="text-teal-400">{profileImage.name}</span>
                  {' · '}
                  <button
                    type="button"
                    onClick={handleRemoveProfileImage}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </>
              ) : (
                'Click to add a profile photo (optional)'
              )}
            </p>
            {uploadError && (
              <p className="mt-1 text-sm text-red-400">{uploadError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">JPG, PNG or WebP. Max 5MB</p>
          </div>

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
                  Display Name <span className="text-red-400">*</span>
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
            {isSubmitting ? (
              <LoadingState text="Setting up..." size="sm" inline className="text-gray-900" />
            ) : (
              'Continue'
            )}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}

