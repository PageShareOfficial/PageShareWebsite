'use client';

import { useRouter } from 'next/navigation';
import AdminPortal from '@/components/app/admin/AdminPortal';
import ErrorState from '@/components/app/common/ErrorState';
import LoadingState from '@/components/app/common/LoadingState';
import Topbar from '@/components/app/layout/Topbar';
import { ArrowLeft } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';

/** The backend enforces admin on every admin API; this gate only avoids a broken UI. */
export default function AdminPage() {
  const router = useRouter();
  const { backendUser, loading } = useAuth();

  let content: React.ReactNode;
  if (loading) {
    content = <LoadingState text="Checking access…" />;
  } else if (backendUser?.is_admin !== true) {
    content = (
      <ErrorState
        title="Admin access required"
        message="This area is only available to PageShare admins."
        actionLabel="Back to home"
        actionIcon={ArrowLeft}
        onRetry={() => router.push(ROUTES.home)}
      />
    );
  } else {
    content = <AdminPortal />;
  }

  return (
    <>
      <Topbar />
      {content}
    </>
  );
}
