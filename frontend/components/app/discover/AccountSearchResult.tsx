'use client';

import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import UserBadge from '@/components/app/common/UserBadge';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';

interface AccountSearchResultProps {
  user: User;
  currentUserHandle?: string;
  onFollowChange?: () => void;
}

/**
 * Account search result card
 * Simple card that navigates to user profile page on click
 * The profile page (/[username]) will show full details
 */
export default function AccountSearchResult({
  user,
}: AccountSearchResultProps) {
  const router = useRouter();

  const handleClick = () => {
    navigateToProfile(user.handle, router);
  };

  return (
    <div
      onClick={handleClick}
      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <AvatarWithFallback
          src={user.avatar}
          alt={user.displayName}
          size={40}
          className="flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">
              {user.displayName}
            </span>
            {user.badge && (
              <UserBadge badge={user.badge} size="sm" />
            )}
          </div>
          <div className="text-sm text-gray-400 truncate">
            @{user.handle}
          </div>
        </div>
      </div>
    </div>
  );
}
