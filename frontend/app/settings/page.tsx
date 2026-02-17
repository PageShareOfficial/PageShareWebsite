'use client';

import { Suspense, useState, useEffect } from 'react';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import RightRail from '@/components/app/layout/RightRail';
import DeleteAccountModal from '@/components/app/modals/DeleteAccountModal';
import Loading from '@/components/app/common/Loading';
import LoadingState from '@/components/app/common/LoadingState';
import { getCurrentUser } from '@/utils/user/profileUtils';
import { Report, isAutoHideReportedEnabled, toggleAutoHideReported } from '@/utils/content/reportUtils';
import { listMyReports, type ReportHistoryItemResponse } from '@/lib/api/reportApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { useAuth } from '@/contexts/AuthContext';
import { useContentFiltersContext } from '@/contexts/ContentFiltersContext';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { apiDelete } from '@/lib/api/client';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser: authCurrentUser } = useCurrentUser();
  const { session, signOut } = useAuth();
  const {
    mutedUsers,
    blockedUsers,
    loading: filtersLoading,
    unmute,
    unblock,
  } = useContentFiltersContext();
  const { watchlist, setWatchlist, loading: watchlistLoading, openManageModal } = useWatchlist();
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'muted' | 'blocked' | 'reports'>('muted');
  const [autoHideReported, setAutoHideReported] = useState(false);

  // Prefer backend user when logged in; otherwise fallback from profileUtils
  const effectiveUser = authCurrentUser ?? currentUser;

  useEffect(() => {
    setIsClient(true);
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'delete') {
      setIsDeleteModalOpen(true);
      router.replace('/settings', { scroll: false });
    }
  }, [searchParams, router]);

  // Load reports and auto-hide setting
  useEffect(() => {
    if (!isClient || !effectiveUser.handle || !session?.access_token) return;

    let cancelled = false;

    const loadData = async () => {
      setReportsLoading(true);
      try {
        const apiReports = await listMyReports(session.access_token);
        if (cancelled) return;

        const mapped: Report[] = apiReports
          // We currently only support post/comment reports in the UI
          .filter((r) => r.content_type === 'post' || r.content_type === 'comment')
          .map((r: ReportHistoryItemResponse) => ({
            id: r.id,
            contentType: r.content_type === 'comment' ? 'comment' : 'post',
            contentId: r.content_id,
            postId: r.post_id ?? undefined,
            reportedUserHandle: r.reported_user_handle,
            reporterHandle: effectiveUser.handle,
            // Backend stores the short code in report_type -> exposed as reason
            reason: r.reason as Report['reason'],
            description: r.description ?? undefined,
            timestamp: r.created_at,
          }));

        setReports(mapped);
        setAutoHideReported(isAutoHideReportedEnabled(effectiveUser.handle));
      } catch {
        if (!cancelled) {
          setReports([]);
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    };

    loadData();

    const handleAutoHideUpdated = () => {
      setAutoHideReported(isAutoHideReportedEnabled(effectiveUser.handle));
    };

    window.addEventListener('autoHideReportedUpdated', handleAutoHideUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('autoHideReportedUpdated', handleAutoHideUpdated);
    };
  }, [isClient, effectiveUser.handle, session?.access_token]);

  const handleUnmute = async (handle: string) => {
    const user = mutedUsers.find((u) => u.username === handle);
    if (!user) return;
    await unmute(user.id);
  };

  const handleUnblock = async (handle: string) => {
    const user = blockedUsers.find((u) => u.username === handle);
    if (!user) return;
    await unblock(user.id);
  };

  const handleToggleAutoHide = () => {
    toggleAutoHideReported(effectiveUser.handle);
    setAutoHideReported(!autoHideReported);
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) throw new Error('Session expired. Please sign in again.');
    await apiDelete('/users/me', session.access_token);
    signOut();
  };

  const deleteUsername = effectiveUser.handle;

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
                    {filtersLoading ? (
                      <LoadingState text="Loading muted users..." />
                    ) : mutedUsers.length === 0 ? (
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
                        {mutedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <AvatarWithFallback
                                src={user.profile_picture_url ?? undefined}
                                alt={user.display_name}
                                size={48}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-semibold text-white text-sm truncate">
                                    {user.display_name}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnmute(user.username)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors ml-4"
                            >
                              Unmute
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Blocked Users Tab */}
                {activeTab === 'blocked' && (
                  <div>
                    {filtersLoading ? (
                      <LoadingState text="Loading blocked users..." />
                    ) : blockedUsers.length === 0 ? (
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
                        {blockedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <AvatarWithFallback
                                src={user.profile_picture_url ?? undefined}
                                alt={user.display_name}
                                size={48}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-semibold text-white text-sm truncate">
                                    {user.display_name}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnblock(user.username)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors ml-4"
                            >
                              Unblock
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Report History Tab */}
                {activeTab === 'reports' && (
                  <div>
                    {reportsLoading ? (
                      <LoadingState text="Loading report history..." />
                    ) : reports.length === 0 ? (
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
                        {reports.map((report) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delete Account - Danger Zone */}
              <div className="px-2 py-8 lg:px-4 border-t border-white/10">
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <h2 className="text-lg font-bold text-red-400 mb-1">Delete account</h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </p>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Delete my account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={openManageModal}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
            isLoading={watchlistLoading}
          />
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        username={deleteUsername}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loading />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

