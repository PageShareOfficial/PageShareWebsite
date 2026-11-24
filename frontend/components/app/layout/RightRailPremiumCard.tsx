'use client';

import LoadingState from '@/components/app/common/LoadingState';

interface RightRailPremiumCardProps {
  isLoading: boolean;
  showUpgrade: boolean;
  onUpgrade: () => void;
  isOnline: boolean;
}

export default function RightRailPremiumCard({
  isLoading,
  showUpgrade,
  onUpgrade,
  isOnline,
}: RightRailPremiumCardProps) {
  if (isLoading) {
    return (
      <div className="bg-linear-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5 shrink-0">
        <LoadingState size="sm" className="py-6" />
      </div>
    );
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <div className="bg-linear-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5 shrink-0">
      <h2 className="text-lg font-semibold text-white mb-2">Premium</h2>
      <p className="text-sm text-gray-300 mb-4">
        Premium AI tools, deeper filters, and credibility analytics.
      </p>
      <button
        type="button"
        onClick={onUpgrade}
        disabled={!isOnline}
        title={!isOnline ? 'Connect to the internet to continue' : undefined}
        className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
      >
        Upgrade
      </button>
    </div>
  );
}
