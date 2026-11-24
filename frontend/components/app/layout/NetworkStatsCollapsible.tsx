'use client';

import { useState } from 'react';
import NetworkStatsCards from '@/components/app/layout/NetworkStatsCards';
import NetworkStatsCollapsibleHeader from '@/components/app/layout/NetworkStatsCollapsibleHeader';
import { useOpenPremiumWhenOnline } from '@/hooks/billing/useOpenPremiumWhenOnline';
import { useNetworkStats } from '@/hooks/network/useNetworkStats';
import { getNetworkStatsSectionClassName } from '@/lib/network/networkStatsPlacement';
import type { NetworkStatsPlacement } from '@/lib/network/networkStatsPlacement';

type NetworkStatsCollapsibleProps = {
  placement: NetworkStatsPlacement;
};

export default function NetworkStatsCollapsible({ placement }: NetworkStatsCollapsibleProps) {
  const [expanded, setExpanded] = useState(true);
  const { stats, loading } = useNetworkStats({ enabled: expanded });
  const { openPremiumPlans, isOnline } = useOpenPremiumWhenOnline();

  const toggleExpanded = () => setExpanded((open) => !open);

  return (
    <section className={getNetworkStatsSectionClassName(placement)} aria-label="Our Network stats">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <NetworkStatsCollapsibleHeader expanded={expanded} onToggle={toggleExpanded} />
        {expanded ? (
          <div className="p-3">
            <NetworkStatsCards
              stats={stats}
              loading={loading}
              onOpenPlans={openPremiumPlans}
              ctaDisabled={!isOnline}
              rowOnTablet
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
