'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { X, Camera, Loader2 } from 'lucide-react';
import { interestsOptions } from '@/utils/constants';
import { ProfileUser } from '@/utils/profileUtils';

// Form validation schema
const editProfileSchema = z.object({
  displayName: z.string().optional(),
  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(200, 'Bio must not exceed 200 characters')
    .optional()
    .or(z.literal('')),
  interests: z.array(z.string()).min(0).optional(),
  avatar: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileUser: ProfileUser;
  onSave: (updatedProfile: Partial<ProfileUser>) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profileUser,
  onSave,
}: EditProfileModalProps) {
  const [avatarPreview, setAvatarPreview] = useState<string>(profileUser.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: profileUser.displayName,
      bio: profileUser.bio || '',
      interests: profileUser.interests || [],
      avatar: profileUser.avatar,
    },
  });

  const selectedInterests = watch('interests') || [];
  const bioValue = watch('bio') || '';

  // Reset form when modal opens/closes or profileUser changes
  useEffect(() => {
    if (isOpen) {
      reset({
        displayName: profileUser.displayName,
        bio: profileUser.bio || '',
        interests: profileUser.interests || [],
        avatar: profileUser.avatar,
      });
      setAvatarPreview(profileUser.avatar);
      setAvatarFile(null);
    }
  }, [isOpen, profileUser, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setValue('avatar', result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profileUser.avatar); // Reset to original
    setValue('avatar', profileUser.avatar);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleInterest = (interest: string) => {
    const current = selectedInterests;
    if (current.includes(interest)) {
      setValue('interests', current.filter((i) => i !== interest));
    } else {
      setValue('interests', [...current, interest]);
    }
  };

  const onSubmit = async (data: EditProfileFormData) => {
    setIsUploading(true);

    try {
      // Convert avatar file to data URL if a new file was selected
      let avatarUrl = data.avatar || profileUser.avatar;
      
      if (avatarFile) {
        avatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
      }

      // Prepare updated profile
      const updatedProfile: Partial<ProfileUser> = {
        displayName: data.displayName || profileUser.displayName,
        bio: data.bio || '',
        interests: data.interests || [],
        avatar: avatarUrl,
      };

      // Save to localStorage
      const profileKey = `pageshare_profile_${profileUser.handle.toLowerCase()}`;
      localStorage.setItem(profileKey, JSON.stringify(updatedProfile));

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('profileUpdated'));

      // Call onSave callback
      onSave(updatedProfile);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-black border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-black z-10">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white/20">
                <Image
                  src={avatarPreview}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                aria-label="Change profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {avatarFile && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove photo
              </button>
            )}
            <p className="mt-2 text-xs text-gray-400 text-center max-w-xs">
              JPG or PNG. Max size 5MB
            </p>
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
              placeholder="Display name"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
              Bio <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <textarea
              {...register('bio')}
              id="bio"
              rows={4}
              maxLength={200}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 text-right">
              {bioValue.length}/200 characters
            </p>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Interests <span className="text-gray-500 text-xs">(optional)</span>
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
                        ? 'bg-white text-black'
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 px-4 py-3 bg-white rounded-full text-black font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

