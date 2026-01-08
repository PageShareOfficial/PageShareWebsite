'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, UserPlus, UserMinus } from 'lucide-react';
import { User } from '@/types';

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
}

const formatJoinedDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Joined ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function ProfileHeader({
  profileUser,
  isOwnProfile,
  stats,
  onEditProfile,
  onFollow,
  isFollowing = false,
}: ProfileHeaderProps) {
  const router = useRouter();

  const handleFollowersClick = () => {
    router.push(`/${profileUser.handle}/followers`);
  };

  const handleFollowingClick = () => {
    router.push(`/${profileUser.handle}/followings`);
  };
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <Image
            src={profileUser.avatar}
            alt={profileUser.displayName}
            width={120}
            height={120}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/20"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 mb-4">
            {/* Name and Edit Profile Button Row - Mobile: same line, Desktop: separate */}
            <div className="flex items-center justify-between gap-2 md:justify-start md:gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">
                  {profileUser.displayName}
                </h1>
                {profileUser.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 flex-shrink-0">
                    {profileUser.badge}
                  </span>
                )}
              </div>
              
              {/* Edit Profile or Follow Button - Mobile: inline with name, Desktop: separate */}
              {isOwnProfile ? (
                <button
                  onClick={onEditProfile}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors text-xs md:text-sm flex-shrink-0"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={onFollow}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm flex-shrink-0 flex items-center gap-1.5 md:gap-2 ${
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
            </div>
            
            {/* Handle */}
            <p className="text-gray-400 text-sm md:text-base">@{profileUser.handle}</p>
          </div>

          {/* Stats - Twitter style: Posts, Following, Followers */}
          <div className="flex gap-6 mb-4 text-sm md:text-base">
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
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </div>
            <div 
              onClick={handleFollowersClick}
              className="cursor-pointer relative group"
            >
              <span className="font-semibold text-white">{profileUser.followers || 0}</span>
              <span className="text-gray-400 ml-1">Followers</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </div>
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <div className="mb-4">
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                {profileUser.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {profileUser.interests && profileUser.interests.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {profileUser.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-white/5 border border-white/20 rounded-full text-xs text-gray-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Joined Date with Calendar Icon */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {profileUser.joinedDate ? formatJoinedDate(profileUser.joinedDate) : 'Joined recently'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

