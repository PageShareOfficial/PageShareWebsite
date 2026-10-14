'use client';

import { useState, type ComponentType } from 'react';
import AdminErrorsPanel from '@/components/app/admin/AdminErrorsPanel';
import AdminMetricsPanel from '@/components/app/admin/AdminMetricsPanel';
import AdminReportsPanel from '@/components/app/admin/AdminReportsPanel';
import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';

type AdminTab = 'reports' | 'metrics' | 'errors';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'reports', label: 'Reports' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'errors', label: 'Error logs' },
];

const PANELS: Record<AdminTab, ComponentType> = {
  reports: AdminReportsPanel,
  metrics: AdminMetricsPanel,
  errors: AdminErrorsPanel,
};

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
}

function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Admin sections"
      className="flex gap-1 border-b border-white/10 px-2"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const stateClass = isActive
          ? 'border-violet-400 text-white'
          : 'border-transparent text-gray-400 hover:text-gray-200';
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${stateClass}`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>('reports');
  const ActivePanel = PANELS[activeTab];

  return (
    <div className="flex-1 pb-16 md:pb-0">
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <h1 className="text-xl font-bold text-white">Admin</h1>
        <VerifiedTickIcon variant="admin" size={18} title="PageShare admin" />
      </header>
      <AdminTabs activeTab={activeTab} onChange={setActiveTab} />
      <div role="tabpanel" className="px-4 py-5">
        <ActivePanel />
      </div>
    </div>
  );
}
