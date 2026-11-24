'use client';

import { ChevronDown, ChevronUp } from '@/constants/icons';
import { OUR_NETWORK_SECTION_LABEL } from '@/lib/network/networkStatsCardConfig';

interface NetworkStatsCollapsibleHeaderProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function NetworkStatsCollapsibleHeader({
  expanded,
  onToggle,
}: NetworkStatsCollapsibleHeaderProps) {
  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
        expanded ? 'border-b border-white/10' : ''
      }`}
      aria-expanded={expanded}
    >
      <span className="text-sm font-semibold text-white">{OUR_NETWORK_SECTION_LABEL}</span>
      <ChevronIcon className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
    </button>
  );
}
