'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Topbar from '@/components/app/layout/Topbar';
import Loading from '@/components/app/common/Loading';
import SettingsBillingLink from '@/components/app/settings/SettingsBillingLink';
import AutoHideReportedToggle from '@/components/app/settings/AutoHideReportedToggle';
import SettingsPrivacyTabs, {
  type SettingsPrivacyTab,
} from '@/components/app/settings/SettingsPrivacyTabs';
import FilteredUsersPanel from '@/components/app/settings/FilteredUsersPanel';
import ReportHistoryPanel from '@/components/app/settings/ReportHistoryPanel';
import DeleteAccountSection from '@/components/app/settings/DeleteAccountSection';
import { getCurrentUser } from '@/utils/user/profileUtils';
import { toggleAutoHideReported } from '@/utils/content/reportUtils';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { useAuth } from '@/contexts/AuthContext';
import { useContentFiltersContext } from '@/contexts/ContentFiltersContext';
import { useMyReports } from '@/hooks/features/useMyReports';
import { apiDelete } from '@/lib/api/client';
import { forgetRememberedAccount } from '@/utils/auth/rememberedAccount';
import { ROUTES, SETTINGS_DELETE_ACCOUNT_QUERY } from '@/constants/routes';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

export default function SettingsPageContent() {
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

  const [isClient, setIsClient] = useState(false);
  const [fallbackUser, setFallbackUser] = useState(getCurrentUser());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsPrivacyTab>('muted');
  const [filterActionError, setFilterActionError] = useState<string | null>(null);

  const effectiveUser = authCurrentUser ?? fallbackUser;
  const {
    reports,
    reportsLoading,
    reportsError,
    autoHideReported,
    setAutoHideReported,
  } = useMyReports(session?.access_token, effectiveUser.handle, isClient);

  useEffect(() => {
    setIsClient(true);
    setFallbackUser(getCurrentUser());
  }, []);

  useEffect(() => {
    const { key, value } = SETTINGS_DELETE_ACCOUNT_QUERY;
    if (searchParams.get(key) === value) {
      setIsDeleteModalOpen(true);
      router.replace(ROUTES.settings, { scroll: false });
    }
  }, [searchParams, router]);

  const handleUnmute = async (handle: string) => {
    const user = mutedUsers.find((item) => item.username === handle);
    if (!user) return;
    setFilterActionError(null);
    try {
      await unmute(user.id);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to unmute user');
      console.error('Failed to unmute user:', message);
      setFilterActionError(message);
    }
  };

  const handleUnblock = async (handle: string) => {
    const user = blockedUsers.find((item) => item.username === handle);
    if (!user) return;
    setFilterActionError(null);
    try {
      await unblock(user.id);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to unblock user');
      console.error('Failed to unblock user:', message);
      setFilterActionError(message);
    }
  };

  const handleToggleAutoHide = () => {
    toggleAutoHideReported(effectiveUser.handle);
    setAutoHideReported(!autoHideReported);
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) throw new Error('Session expired. Please sign in again.');
    await apiDelete('/users/me', session.access_token);
    forgetRememberedAccount();
    signOut();
  };

  if (!isClient) {
    return (
      <>
        <Topbar />
        <div className="flex min-h-[50vh] flex-1 items-center justify-center">
          <Loading />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar />

      <div className="hidden items-center border-b border-white/10 px-4 py-4 md:flex">
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex flex-1 pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10">
          <SettingsBillingLink />

          <div className="px-2 py-6 lg:px-4">
            <div className="mb-6">
              <h2 className="mb-1 text-lg font-bold text-white">Privacy and Security</h2>
              <p className="text-sm text-gray-400">
                Manage your muted users, blocked users, and report history
              </p>
            </div>

            <AutoHideReportedToggle
              enabled={autoHideReported}
              onToggle={handleToggleAutoHide}
            />

            <SettingsPrivacyTabs
              activeTab={activeTab}
              onTabChange={(tab) => {
                setFilterActionError(null);
                setActiveTab(tab);
              }}
            />

            {activeTab === 'muted' ? (
              <FilteredUsersPanel
                variant="muted"
                users={mutedUsers}
                loading={filtersLoading}
                actionError={filterActionError}
                onAction={handleUnmute}
              />
            ) : null}

            {activeTab === 'blocked' ? (
              <FilteredUsersPanel
                variant="blocked"
                users={blockedUsers}
                loading={filtersLoading}
                actionError={filterActionError}
                onAction={handleUnblock}
              />
            ) : null}

            {activeTab === 'reports' ? (
              <ReportHistoryPanel
                reports={reports}
                loading={reportsLoading}
                error={reportsError}
              />
            ) : null}
          </div>

          <DeleteAccountSection
            username={effectiveUser.handle}
            isOpen={isDeleteModalOpen}
            onOpen={() => setIsDeleteModalOpen(true)}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteAccount}
          />
        </div>
      </div>
    </>
  );
}
