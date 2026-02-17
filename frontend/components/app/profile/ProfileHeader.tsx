'use client';

import { useRouter } from 'next/navigation';
import { Calendar, UserPlus, UserMinus } from 'lucide-react';
import { User } from '@/types';
import UserBadge from '@/components/app/common/UserBadge';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import Skeleton from '@/components/app/common/Skeleton';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { formatJoinedDate } from '@/utils/core/dateUtils';

interface ProfileUser extends User {
  joinedDate: string;
  followers: number;
  following: number;
  bio: string;
  interests: string[];
}

interface ProfileHeaderProps {
  profileUser: ProfileUser;
  isOwnProfile: boolean;
  stats: {
    posts: number;
    replies: number;
    likes: number;
  };
  onEditProfile?: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
  followLoading?: boolean;
  /** When true, show only avatar, display name, @handle, bio, and joined date (no Edit/Follow, stats, interests) */
  basicOnly?: boolean;
}

/** Skeleton for profile header – mirrors layout of ProfileHeader for loading state. */
export function ProfileHeaderSkeleton() {
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="flex-shrink-0">
          <Skeleton variant="circular" width={128} height={128} className="w-24 h-24 md:w-32 md:h-32" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <Skeleton variant="text" width={180} height={28} className="max-w-full" />
          <Skeleton variant="text" width={120} height={16} />
          <div className="flex gap-6">
            <Skeleton variant="text" width={48} height={20} />
            <Skeleton variant="text" width={64} height={20} />
            <Skeleton variant="text" width={64} height={20} />
          </div>
        </div>
      </div>
      <div className="mt-6 w-full space-y-4">
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" height={14} />
          <Skeleton variant="text" width="90%" height={14} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton variant="text" width={64} height={24} className="rounded-full" />
          <Skeleton variant="text" width={80} height={24} className="rounded-full" />
          <Skeleton variant="text" width={56} height={24} className="rounded-full" />
        </div>
        <Skeleton variant="text" width={100} height={14} />
      </div>
    </div>
  );
}

export default function ProfileHeader({
  profileUser,
  isOwnProfile,
  stats,
  onEditProfile,
  onFollow,
  isFollowing = false,
  followLoading = false,
  basicOnly = false,
}: ProfileHeaderProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const handleFollowersClick = () => {
    router.push(`/${profileUser.handle}/followers`);
  };

  const handleFollowingClick = () => {
    router.push(`/${profileUser.handle}/followers?tab=following`);
  };
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      {/* Top row: Avatar + Name, handle, button, stats */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="flex-shrink-0">
          <AvatarWithFallback
            src={profileUser.avatar}
            alt={profileUser.displayName}
            size={128}
            className="w-24 h-24 md:w-32 md:h-32 border-2 border-white/20"
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-white truncate">
                {profileUser.displayName}
              </h1>
              {profileUser.badge && (
                <UserBadge badge={profileUser.badge} size="md" />
              )}
            </div>
            {!basicOnly && (
              <>
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={onEditProfile}
                    disabled={!isOnline}
                    title={!isOnline ? 'Connect to the internet to continue' : undefined}
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors text-xs md:text-sm flex-shrink-0 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={onFollow}
                    disabled={followLoading || !isOnline}
                    title={!isOnline ? 'Connect to the internet to continue' : undefined}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm flex-shrink-0 flex items-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${
                      isFollowing
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-gray-400 text-sm md:text-base">@{profileUser.handle}</p>
          {!basicOnly && (
            <div className="flex gap-6 text-sm md:text-base">
              <div className="hover:underline cursor-pointer">
                <span className="font-semibold text-white">{stats.posts}</span>
                <span className="text-gray-400 ml-1">Posts</span>
              </div>
              <div
                onClick={handleFollowingClick}
                className="cursor-pointer relative group"
              >
                <span className="font-semibold text-white">{profileUser.following || 0}</span>
                <span className="text-gray-400 ml-1">Following</span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </div>
              <div
                onClick={handleFollowersClick}
                className="cursor-pointer relative group"
              >
                <span className="font-semibold text-white">{profileUser.followers || 0}</span>
                <span className="text-gray-400 ml-1">Followers</span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-width below image: Bio, interests, joined date */}
      <div className="mt-6 w-full space-y-4">
        {profileUser.bio && (
          <p className="text-white text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
            {profileUser.bio}
          </p>
        )}
        {!basicOnly && profileUser.interests && profileUser.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profileUser.interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 bg-white/5 border border-white/20 rounded-full text-xs md:text-sm text-gray-300"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>
            {formatJoinedDate(profileUser.joinedDate)}
          </span>
        </div>
      </div>
    </div>
  );
}

