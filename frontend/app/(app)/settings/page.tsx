'use client';

import { Suspense } from 'react';
import Loading from '@/components/app/common/Loading';
import SettingsPageContent from '@/components/app/settings/SettingsPageContent';

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-1 items-center justify-center">
          <Loading />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
