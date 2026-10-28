'use client';

export type SettingsPrivacyTab = 'muted' | 'blocked' | 'reports';

const TABS: { id: SettingsPrivacyTab; label: string }[] = [
  { id: 'muted', label: 'Muted Users' },
  { id: 'blocked', label: 'Blocked Users' },
  { id: 'reports', label: 'Report History' },
];

interface SettingsPrivacyTabsProps {
  activeTab: SettingsPrivacyTab;
  onTabChange: (tab: SettingsPrivacyTab) => void;
}

/** Tab chrome for muted / blocked / report history. */
export default function SettingsPrivacyTabs({
  activeTab,
  onTabChange,
}: SettingsPrivacyTabsProps) {
  return (
    <div className="mb-6 flex space-x-1 border-b border-white/10">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {tab.label}
          {activeTab === tab.id ? (
            <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-cyan-400" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
