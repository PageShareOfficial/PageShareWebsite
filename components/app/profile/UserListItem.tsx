'use client';

import { useRouter } from 'next/navigation';
import { UserPlus, UserMinus } from 'lucide-react';
import { User } from '@/types';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import UserBadge from '@/components/app/common/UserBadge';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';

interface UserListItemProps {
  user: User;
  currentUserHandle: string;
  isFollowing: boolean;
  onFollowToggle: (userHandle: string) => void;
  showFollowButton?: boolean;
}

export default function UserListItem({
  user,
  currentUserHandle,
  isFollowing,
  onFollowToggle,
  showFollowButton = true,
}: UserListItemProps) {
  const router = useRouter();
  const isOwnProfile = currentUserHandle.toLowerCase() === user.handle.toLowerCase();

  const handleProfileClick = () => {
    navigateToProfile(user.handle, router);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowToggle(user.handle);
  };

  return (
    <div
      onClick={handleProfileClick}
      className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/10 flex items-center justify-between"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar */}
        <AvatarWithFallback
          src={user.avatar}
          alt={user.displayName}
          size={48}
          className="flex-shrink-0"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-white text-sm truncate">
              {user.displayName}
            </span>
            {user.badge && (
              <UserBadge badge={user.badge} size="md" />
            )}
          </div>
          <p className="text-gray-400 text-sm truncate">@{user.handle}</p>
        </div>
      </div>

      {/* Follow Button */}
      {showFollowButton && !isOwnProfile && (
        <button
          onClick={handleFollowClick}
          className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-colors flex items-center gap-1.5 flex-shrink-0 ${
            isFollowing
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          {isFollowing ? (
            <>
              <UserMinus className="w-4 h-4" />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

