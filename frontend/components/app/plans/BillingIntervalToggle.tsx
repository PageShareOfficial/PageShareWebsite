'use client';

import type { BillingInterval, PlanTheme } from './planData';

interface BillingIntervalToggleProps {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  size?: 'sm' | 'md';
  theme?: PlanTheme | 'neutral';
}

const THEME_ACTIVE: Record<PlanTheme, string> = {
  analyst: 'bg-blue-600 text-white',
  investor: 'bg-emerald-600 text-white',
};

export default function BillingIntervalToggle({
  interval,
  onChange,
  size = 'md',
  theme = 'neutral',
}: BillingIntervalToggleProps) {
  const isSmall = size === 'sm';
  const activeClass =
    theme === 'neutral' ? 'bg-white text-black' : THEME_ACTIVE[theme];

  const getButtonClass = (selected: boolean) => {
    const padding = isSmall ? 'px-3 py-1' : 'px-4 py-1.5';
    if (selected) return `${padding} rounded-full font-medium transition-colors ${activeClass}`;
    return `${padding} rounded-full font-medium transition-colors text-gray-400 hover:text-white`;
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border border-white/15 bg-white/5 p-1 ${
        isSmall ? 'text-xs' : 'text-sm'
      }`}
      role="group"
      aria-label="Billing interval"
    >
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={getButtonClass(interval === 'monthly')}
        aria-pressed={interval === 'monthly'}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={getButtonClass(interval === 'yearly')}
        aria-pressed={interval === 'yearly'}
      >
        Yearly
      </button>
    </div>
  );
}
