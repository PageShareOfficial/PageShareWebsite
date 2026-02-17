'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import MobileHeader from '@/components/app/layout/MobileHeader';
import RightRail from '@/components/app/layout/RightRail';
import UserListItem from '@/components/app/profile/UserListItem';
import Loading from '@/components/app/common/Loading';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import { User } from '@/types';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProfileByUsername,
  listFollowersApi,
  listFollowingApi,
  followUserApi,
  unfollowUserApi,
  type ProfileByUsernameResponse,
  type FollowerFollowingItem,
} from '@/lib/api/userApi';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/api/client';

function mapItemToUser(item: FollowerFollowingItem): User {
  return {
    id: item.id,
    displayName: item.display_name,
    handle: item.username,
    avatar: item.profile_picture_url ?? '',
    badge: undefined,
  };
}

type Tab = 'followers' | 'following';

interface FollowListPageProps {
  username: string;
  initialTab: Tab;
}

export default function FollowListPage({ username, initialTab }: FollowListPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [profile, setProfile] = useState<ProfileByUsernameResponse | null>(null);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [followers, setFollowers] = useState<FollowerFollowingItem[]>([]);
  const [following, setFollowing] = useState<FollowerFollowingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const apiUrl = getBaseUrl();
  const { currentUser } = useCurrentUser();
  const { session } = useAuth();
  const { watchlist, setWatchlist, openManageModal } = useWatchlist();
  const token = session?.access_token ?? null;

  const tabSwitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TAB_SWITCH_DEBOUNCE_MS = 180;

  // Sync tab from URL (query param) so tab switch only updates query – no remount, no refetch
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = useCallback(
    (tab: Tab) => {
      if (tab === activeTab) return;
      if (tabSwitchTimeoutRef.current) {
        clearTimeout(tabSwitchTimeoutRef.current);
        tabSwitchTimeoutRef.current = null;
      }
      tabSwitchTimeoutRef.current = setTimeout(() => {
        tabSwitchTimeoutRef.current = null;
        setActiveTab(tab);
        // Same path, only query changes – page stays mounted, no refetch
        router.replace(`/${username}/followers${tab === 'following' ? '?tab=following' : ''}`);
      }, TAB_SWITCH_DEBOUNCE_MS);
    },
    [activeTab, username, router]
  );

  useEffect(() => {
    return () => {
      if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
    };
  }, []);

  // Fetch profile by username to get user id
  useEffect(() => {
    if (!apiUrl || !username) return;
    let cancelled = false;
    getProfileByUsername(username, token)
      .then((data) => {
        if (cancelled) return;
        if (data === null) setProfileNotFound(true);
        else setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfileNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, username, token]);

  // Fetch both followers and following once when profile is available. Never refetched on tab switch.
  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      listFollowersApi(profile.id, token, { per_page: 50 }),
      listFollowingApi(profile.id, token, { per_page: 50 }),
    ])
      .then(([followersRes, followingRes]) => {
        setFollowers(followersRes.data);
        setFollowing(followingRes.data);
      })
      .catch(() => {
        setFollowers([]);
        setFollowing([]);
      })
      .finally(() => setLoading(false));
  }, [profile?.id, token]);

  const handleFollowToggle = async (targetUserHandle: string) => {
    const list = activeTab === 'followers' ? followers : following;
    const item = list.find((u) => u.username === targetUserHandle);
    if (!item || !token) return;
    const prevFollowing = item.is_following;

    const updateList = (
      prev: FollowerFollowingItem[],
      id: string,
      isFollowing: boolean
    ) =>
      prev.map((u) =>
        u.id === id ? { ...u, is_following: isFollowing } : u
      );

    // Optimistic update: toggle is_following, keep row in list
    setFollowers((prev) => updateList(prev, item.id, !prevFollowing));
    setFollowing((prev) => updateList(prev, item.id, !prevFollowing));
    setToggleLoadingId(item.id);

    try {
      if (prevFollowing) {
        await unfollowUserApi(item.id, token);
        setFollowers((prev) => updateList(prev, item.id, false));
        setFollowing((prev) => updateList(prev, item.id, false));
      } else {
        await followUserApi(item.id, token);
        setFollowers((prev) => updateList(prev, item.id, true));
        setFollowing((prev) => updateList(prev, item.id, true));
      }
    } catch {
      // Revert on failure
      setFollowers((prev) => updateList(prev, item.id, prevFollowing));
      setFollowing((prev) => updateList(prev, item.id, prevFollowing));
    } finally {
      setToggleLoadingId(null);
    }
  };

  if (!username) return null;
  if (!apiUrl) notFound();
  if (profileNotFound) notFound();

  const displayName = profile?.display_name ?? username;
  const handle = profile?.username ?? username;

  // Single loading state: show one loading screen until profile + both lists are ready. No per-tab loading.
  const pageReady = !!profile && !loading;
  const currentList = activeTab === 'followers' ? followers : following;

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex justify-center">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
            <div className="w-full border-l border-r border-white/10 flex-1 flex pb-16 md:pb-0 items-center justify-center min-h-[400px]">
              <Loading />
            </div>
          </div>
          <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
            <RightRail
              watchlist={watchlist}
              onManageWatchlist={openManageModal}
              onUpgradeLabs={() => router.push('/plans')}
              onUpdateWatchlist={setWatchlist}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          <MobileHeader
            title={activeTab === 'followers' ? 'Followers' : 'Following'}
            onBack={() => navigateToProfile(username, router)}
          />
          <div className="hidden md:block">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
          </div>

          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10">
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
                      <h1 className="text-xl font-bold text-white">{displayName}</h1>
                      <p className="text-gray-400 text-sm">@{handle}</p>
                    </div>
                  </div>

                  <div className="flex border-b border-white/10">
                    <button
                      onClick={() => handleTabChange('followers')}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                        activeTab === 'followers'
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Followers
                      {activeTab === 'followers' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                      )}
                    </button>
                    <button
                      onClick={() => handleTabChange('following')}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                        activeTab === 'following'
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Following
                      {activeTab === 'following' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:hidden border-b border-white/10">
                <div className="flex">
                  <button
                    onClick={() => handleTabChange('followers')}
                    className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                      activeTab === 'followers'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Followers
                    {activeTab === 'followers' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange('following')}
                    className={`flex-1 px-4 py-3 text-center font-medium transition-colors relative ${
                      activeTab === 'following'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Following
                    {activeTab === 'following' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                    )}
                  </button>
                </div>
              </div>

              <div className="min-h-[400px]">
                {currentList.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-gray-400">
                      {activeTab === 'followers'
                        ? 'No followers yet'
                        : 'Not following anyone yet'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {currentList.map((item) => (
                      <UserListItem
                        key={item.id}
                        user={mapItemToUser(item)}
                        currentUserHandle={currentUser.handle}
                        isFollowing={item.is_following}
                        onFollowToggle={handleFollowToggle}
                        showFollowButton={
                          currentUser.handle.toLowerCase() !== item.username.toLowerCase()
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={openManageModal}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
          />
        </div>
      </div>
    </div>
  );
}
