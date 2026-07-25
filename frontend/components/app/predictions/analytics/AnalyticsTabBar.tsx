'use client';

export type AnalyticsTabId = 'dashboard' | 'predictions';

interface AnalyticsTabBarProps {
  activeTab: AnalyticsTabId;
  onTabChange: (tab: AnalyticsTabId) => void;
}

const TABS: { id: AnalyticsTabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'predictions', label: 'Predictions' },
];

export default function AnalyticsTabBar({
  activeTab,
  onTabChange,
}: AnalyticsTabBarProps) {
  return (
    <div className="mb-6 flex border-b border-white/10">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 px-4 py-3 text-center text-sm font-medium transition-colors sm:flex-none sm:px-6 ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {isActive ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
