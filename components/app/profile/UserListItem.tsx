'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserPlus, UserMinus } from 'lucide-react';
import { User } from '@/types';

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
    router.push(`/${user.handle}`);
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
        <Image
          src={user.avatar}
          alt={user.displayName}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full flex-shrink-0"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-white text-sm truncate">
              {user.displayName}
            </span>
            {user.badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 flex-shrink-0">
                {user.badge}
              </span>
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

