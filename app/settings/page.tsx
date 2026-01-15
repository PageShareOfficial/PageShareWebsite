'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import RightRail from '@/components/app/layout/RightRail';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import Loading from '@/components/app/common/Loading';
import { getCurrentUser } from '@/utils/user/profileUtils';
import { getMutedUsers, unmuteUser } from '@/utils/user/muteUtils';
import { getBlockedUsers, unblockUser } from '@/utils/user/blockUtils';
import { getReportsByUser, Report, isAutoHideReportedEnabled, toggleAutoHideReported } from '@/utils/content/reportUtils';
import { getUserByUsername } from '@/utils/user/profileUtils';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useProfileData } from '@/hooks/user/useProfileData';
import UserBadge from '@/components/app/common/UserBadge';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';

export default function SettingsPage() {
  const router = useRouter();
  const { watchlist, setWatchlist, isClient: isProfileDataClient } = useProfileData();
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [mutedUserHandles, setMutedUserHandles] = useState<string[]>([]);
  const [blockedUserHandles, setBlockedUserHandles] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'muted' | 'blocked' | 'reports'>('muted');
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  const [autoHideReported, setAutoHideReported] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentUser(getCurrentUser());
  }, []);

  // Load muted users, blocked users, reports, and auto-hide setting
  useEffect(() => {
    if (!isClient || !currentUser.handle) return;

    const loadData = () => {
      setMutedUserHandles(getMutedUsers(currentUser.handle));
      setBlockedUserHandles(getBlockedUsers(currentUser.handle));
      setReports(getReportsByUser(currentUser.handle));
      setAutoHideReported(isAutoHideReportedEnabled(currentUser.handle));
    };

    loadData();

    // Listen for updates
    const handleMutedUsersUpdated = () => {
      setMutedUserHandles(getMutedUsers(currentUser.handle));
    };

    const handleBlockedUsersUpdated = () => {
      setBlockedUserHandles(getBlockedUsers(currentUser.handle));
    };

    const handleReportsUpdated = () => {
      setReports(getReportsByUser(currentUser.handle));
    };

    const handleAutoHideUpdated = () => {
      setAutoHideReported(isAutoHideReportedEnabled(currentUser.handle));
    };

    window.addEventListener('mutedUsersUpdated', handleMutedUsersUpdated);
    window.addEventListener('blockedUsersUpdated', handleBlockedUsersUpdated);
    window.addEventListener('reportsUpdated', handleReportsUpdated);
    window.addEventListener('autoHideReportedUpdated', handleAutoHideUpdated);

    return () => {
      window.removeEventListener('mutedUsersUpdated', handleMutedUsersUpdated);
      window.removeEventListener('blockedUsersUpdated', handleBlockedUsersUpdated);
      window.removeEventListener('reportsUpdated', handleReportsUpdated);
      window.removeEventListener('autoHideReportedUpdated', handleAutoHideUpdated);
    };
  }, [isClient, currentUser.handle]);

  const handleUnmute = (handle: string) => {
    unmuteUser(currentUser.handle, handle);
  };

  const handleUnblock = (handle: string) => {
    unblockUser(currentUser.handle, handle);
  };

  const handleToggleAutoHide = () => {
    toggleAutoHideReported(currentUser.handle);
    setAutoHideReported(!autoHideReported);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getReasonLabel = (reason: string): string => {
    const reasonMap: { [key: string]: string } = {
      spam: 'Spam',
      harassment: 'Harassment or bullying',
      hate_speech: 'Hate speech or symbols',
      misinformation: 'Misinformation',
      inappropriate_content: 'Inappropriate content',
      other: 'Other',
    };
    return reasonMap[reason] || reason;
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading />
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
          {/* Top Bar - Mobile Only */}
          <Topbar onUpgradeLabs={() => router.push('/plans')} />

          {/* Desktop Header - Desktop Only */}
          <div className="hidden md:flex items-center px-4 py-4 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">Settings</h1>
          </div>

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10">
              {/* Privacy and Security Section */}
              <div className="px-2 py-6 lg:px-4">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white mb-1">Privacy and Security</h2>
                  <p className="text-sm text-gray-400">
                    Manage your muted users, blocked users, and report history
                  </p>
                </div>

                {/* Auto-hide Reported Content Toggle */}
                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">Auto-hide reported content</h3>
                      <p className="text-sm text-gray-400">
                        Automatically hide posts and comments you've reported from your feed
                      </p>
                    </div>
                    <button
                      onClick={handleToggleAutoHide}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoHideReported ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={autoHideReported}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoHideReported ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6 border-b border-white/10">
                  <button
                    onClick={() => setActiveTab('muted')}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === 'muted'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Muted Users
                    {activeTab === 'muted' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('blocked')}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === 'blocked'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Blocked Users
                    {activeTab === 'blocked' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === 'reports'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Report History
                    {activeTab === 'reports' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                    )}
                  </button>
                </div>

                {/* Muted Users Tab */}
                {activeTab === 'muted' && (
                  <div>
                    {mutedUserHandles.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="mb-4">
                          <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </svg>
                          </div>
                        </div>
                        <p className="text-lg text-gray-300 mb-2">No muted users</p>
                        <p className="text-sm text-gray-400">
                          Muted users' posts won't appear in your feed, but you can still see their profile
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mutedUserHandles.map((handle) => {
                          const userProfile = getUserByUsername(handle);
                          if (!userProfile) return null;

                          const user: User = {
                            id: userProfile.id,
                            displayName: userProfile.displayName,
                            handle: userProfile.handle,
                            avatar: userProfile.avatar,
                            badge: userProfile.badge,
                          };

                          return (
                            <div
                              key={handle}
                              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <AvatarWithFallback
                                  src={user.avatar}
                                  alt={user.displayName}
                                  size={48}
                                  className="flex-shrink-0"
                                />
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
                              <button
                                onClick={() => handleUnmute(handle)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors ml-4"
                              >
                                Unmute
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Blocked Users Tab */}
                {activeTab === 'blocked' && (
                  <div>
                    {blockedUserHandles.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="mb-4">
                          <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </div>
                        </div>
                        <p className="text-lg text-gray-300 mb-2">No blocked users</p>
                        <p className="text-sm text-gray-400">
                          Blocked users' content won't appear anywhere on the platform
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {blockedUserHandles.map((handle) => {
                          const userProfile = getUserByUsername(handle);
                          if (!userProfile) return null;

                          const user: User = {
                            id: userProfile.id,
                            displayName: userProfile.displayName,
                            handle: userProfile.handle,
                            avatar: userProfile.avatar,
                            badge: userProfile.badge,
                          };

                          return (
                            <div
                              key={handle}
                              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <AvatarWithFallback
                                  src={user.avatar}
                                  alt={user.displayName}
                                  size={48}
                                  className="flex-shrink-0"
                                />
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
                              <button
                                onClick={() => handleUnblock(handle)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors ml-4"
                              >
                                Unblock
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Report History Tab */}
                {activeTab === 'reports' && (
                  <div>
                    {reports.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="mb-4">
                          <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                        </div>
                        <p className="text-lg text-gray-300 mb-2">No reports submitted</p>
                        <p className="text-sm text-gray-400">
                          Reports you submit will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((report) => {
                          const reportedUser = getUserByUsername(report.reportedUserHandle);
                          
                          return (
                            <div
                              key={report.id}
                              className="p-4 bg-white/5 border border-white/10 rounded-xl"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-white font-medium">
                                      Reported {report.contentType === 'post' ? 'post' : 'comment'}
                                    </span>
                                    <span className="text-gray-400 text-sm">from</span>
                                    <span className="text-cyan-400 font-medium">
                                      @{report.reportedUserHandle}
                                    </span>
                                    {report.contentType === 'comment' && report.postId && (
                                      <>
                                        <span className="text-gray-400 text-sm">on post</span>
                                        <span className="text-gray-500 text-sm font-mono">
                                          {report.postId.substring(0, 8)}...
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {reportedUser && (
                                    <div className="text-sm text-gray-400 mb-1">
                                      {reportedUser.displayName}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-500 mb-2">
                                    {formatTimestamp(report.timestamp)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const url = report.contentType === 'post'
                                      ? `/${report.reportedUserHandle}/posts/${report.contentId}`
                                      : report.postId
                                        ? `/${report.reportedUserHandle}/posts/${report.postId}#comment-${report.contentId}`
                                        : `/${report.reportedUserHandle}/posts/${report.contentId}#comment-${report.contentId}`;
                                    router.push(url);
                                  }}
                                  className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                >
                                  View
                                </button>
                              </div>
                              <div className="pt-2 border-t border-white/10">
                                <div className="text-sm text-gray-400 mb-1">Reason:</div>
                                <div className="text-white font-medium">
                                  {getReasonLabel(report.reason)}
                                </div>
                                {report.description && (
                                  <div className="mt-2 text-sm text-gray-400">
                                    {report.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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

