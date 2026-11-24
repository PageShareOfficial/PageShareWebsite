'use client';

import NetworkStatsCards from '@/components/app/layout/NetworkStatsCards';
import RightRailPremiumCard from '@/components/app/layout/RightRailPremiumCard';
import SiteFooter from '@/components/app/layout/SiteFooter';
import { useOpenPremiumWhenOnline } from '@/hooks/billing/useOpenPremiumWhenOnline';
import { useNetworkStats } from '@/hooks/network/useNetworkStats';
import { useSubscription } from '@/hooks/billing/useSubscription';

export default function RightRail() {
  const { stats, loading } = useNetworkStats();
  const { openPremiumPlans, isOnline } = useOpenPremiumWhenOnline();
  const { isPremium, isLoading: isSubscriptionLoading } = useSubscription();
  const showPremiumUpgradeCard = !isSubscriptionLoading && !isPremium;

  return (
    <aside className="hidden lg:flex flex-col w-[350px] sticky top-0 h-screen pt-6 overflow-y-auto">
      <div className="flex flex-col gap-4 pb-6">
        <NetworkStatsCards
          stats={stats}
          loading={loading}
          onOpenPlans={openPremiumPlans}
          ctaDisabled={!isOnline}
        />

        <RightRailPremiumCard
          isLoading={isSubscriptionLoading}
          showUpgrade={showPremiumUpgradeCard}
          onUpgrade={openPremiumPlans}
          isOnline={isOnline}
        />

        <SiteFooter layout="sidebar" />
      </div>
    </aside>
  );
}
