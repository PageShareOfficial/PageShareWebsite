'use client';

import type { IconType } from 'react-icons';
import { LuChartCandlestick } from 'react-icons/lu';
import { MdSpaceDashboard } from 'react-icons/md';

export type AnalyticsTabId = 'dashboard' | 'predictions';

interface AnalyticsTabBarProps {
  activeTab: AnalyticsTabId;
  onTabChange: (tab: AnalyticsTabId) => void;
}

const TABS: {
  id: AnalyticsTabId;
  label: string;
  Icon: IconType;
}[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: MdSpaceDashboard },
  { id: 'predictions', label: 'Predictions', Icon: LuChartCandlestick },
];

export default function AnalyticsTabBar({
  activeTab,
  onTabChange,
}: AnalyticsTabBarProps) {
  return (
    <div className="mb-6 grid grid-cols-2 border-b border-white/10">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const { Icon } = tab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative w-full px-4 py-3.5 transition-colors sm:px-6 sm:py-4 ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="inline-flex items-center justify-center gap-2.5 text-base font-semibold sm:gap-3 sm:text-lg">
              <Icon
                className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
                aria-hidden
              />
              {tab.label}
            </span>
            {isActive ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
