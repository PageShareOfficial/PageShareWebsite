'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import MobileHeader from '@/components/app/layout/MobileHeader';
import RightRail from '@/components/app/layout/RightRail';
import UserListItem from '@/components/app/profile/UserListItem';
import Loading from '@/components/app/common/Loading';
import { getUserByUsername } from '@/utils/user/profileUtils';
import { getFollowers, getFollowing, followUser, unfollowUser, isFollowing, initializeMockFollows } from '@/utils/user/followUtils';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import { User } from '@/types';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';

export default function FollowingsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const username = (params?.username as string) || '';
  
  // Determine initial tab based on pathname
  const getInitialTab = (): 'followers' | 'following' => {
    return pathname?.includes('/followings') ? 'following' : 'followers';
  };
  
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(getInitialTab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);

  // Mock current user - in real implementation, get from session/auth context
  const currentUserHandle = 'johndoe';
  
  // Load watchlist
  const { watchlist, setWatchlist } = useWatchlist();

  const profileUser = username ? getUserByUsername(username) : null;

  // Sync tab with pathname
  useEffect(() => {
    const tab = pathname?.includes('/followings') ? 'following' : 'followers';
    setActiveTab(tab);
  }, [pathname]);

  // Initialize mock follows on mount
  useEffect(() => {
    initializeMockFollows();
  }, []);

  // Load followers and following
  useEffect(() => {
    if (!username) return;

    setIsLoading(true);
    const userFollowers = getFollowers(username);
    const userFollowing = getFollowing(username);
    setFollowers(userFollowers);
    setFollowing(userFollowing);
    setIsLoading(false);
  }, [username]);

  // Handle follow/unfollow toggle
  const handleFollowToggle = (targetUserHandle: string) => {
    const currentlyFollowing = isFollowing(currentUserHandle, targetUserHandle);
    
    if (currentlyFollowing) {
      unfollowUser(currentUserHandle, targetUserHandle);
    } else {
      followUser(currentUserHandle, targetUserHandle);
    }

    // Refresh the lists
    const updatedFollowers = getFollowers(username);
    const updatedFollowing = getFollowing(username);
    setFollowers(updatedFollowers);
    setFollowing(updatedFollowing);
  };

  if (!username || !profileUser) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex justify-center">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
            <div className="flex-1 flex pb-16 md:pb-0">
              <div className="w-full border-l border-r border-white/10 px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">User not found</h1>
                <p className="text-gray-400">The user @{username} doesn't exist.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          {/* Mobile Header - Mobile Only */}
          <MobileHeader 
            title={activeTab === 'followers' ? 'Followers' : 'Following'}
            onBack={() => navigateToProfile(username, router)}
          />
          
          {/* Top Bar - Desktop Only */}
          <div className="hidden md:block">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
          </div>

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10">
              {/* Desktop Header */}
              <div className="hidden md:block sticky top-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => navigateToProfile(username, router)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      aria-label="Go back"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                      <h1 className="text-xl font-bold text-white">{profileUser.displayName}</h1>
                      <p className="text-gray-400 text-sm">@{profileUser.handle}</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-white/10">
                    <button
                      onClick={() => {
                        setActiveTab('followers');
                        router.replace(`/${username}/followers`);
                      }}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                        activeTab === 'followers'
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Followers
                      {activeTab === 'followers' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('following');
                        router.replace(`/${username}/followings`);
                      }}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                        activeTab === 'following'
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Following
                      {activeTab === 'following' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Tabs */}
              <div className="md:hidden border-b border-white/10">
                <div className="flex">
                  <button
                    onClick={() => {
                      setActiveTab('followers');
                      router.replace(`/${username}/followers`);
                    }}
                    className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                      activeTab === 'followers'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Followers
                    {activeTab === 'followers' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('following');
                      router.replace(`/${username}/followings`);
                    }}
                    className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                      activeTab === 'following'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Following
                    {activeTab === 'following' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* User List */}
              <div className="min-h-[400px]">
                {isLoading ? (
                  <Loading />
                ) : activeTab === 'followers' ? (
                  followers.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <p className="text-gray-400">No followers yet</p>
                    </div>
                  ) : (
                    <div>
                      {followers.map((user) => (
                        <UserListItem
                          key={user.id}
                          user={user}
                          currentUserHandle={currentUserHandle}
                          isFollowing={isFollowing(currentUserHandle, user.handle)}
                          onFollowToggle={handleFollowToggle}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  following.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <p className="text-gray-400">Not following anyone yet</p>
                    </div>
                  ) : (
                    <div>
                      {following.map((user) => (
                        <UserListItem
                          key={user.id}
                          user={user}
                          currentUserHandle={currentUserHandle}
                          isFollowing={isFollowing(currentUserHandle, user.handle)}
                          onFollowToggle={handleFollowToggle}
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={() => setIsManageWatchlistOpen(true)}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
          />
        </div>
      </div>

      {/* Manage Watchlist Modal */}
      <ManageWatchlistModal
        isOpen={isManageWatchlistOpen}
        onClose={() => setIsManageWatchlistOpen(false)}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
      />
    </div>
  );
}

