'use client';

import RightRailNetworkCard from '@/components/app/layout/RightRailNetworkCard';
import { buildNetworkStatsCardDefinitions } from '@/lib/network/networkStatsCardConfig';
import type { NetworkStats } from '@/lib/api/networkApi';

interface NetworkStatsCardsProps {
  stats: NetworkStats;
  loading: boolean;
  onOpenPlans: () => void;
  ctaDisabled?: boolean;
  className?: string;
  /** Side-by-side cards from the `sm` breakpoint (mobile/tablet strip). */
  rowOnTablet?: boolean;
}

function resolveLayoutClass(rowOnTablet: boolean): string {
  if (rowOnTablet) {
    return 'flex flex-col gap-3 sm:flex-row sm:items-stretch';
  }
  return 'flex flex-col gap-3';
}

export default function NetworkStatsCards({
  stats,
  loading,
  onOpenPlans,
  ctaDisabled = false,
  className = '',
  rowOnTablet = false,
}: NetworkStatsCardsProps) {
  const cards = buildNetworkStatsCardDefinitions(stats);
  const layoutClass = resolveLayoutClass(rowOnTablet);

  return (
    <div className={`${layoutClass} ${className}`.trim()}>
      {cards.map((card) => (
        <RightRailNetworkCard
          key={card.title}
          title={card.title}
          columns={card.columns}
          href={card.href}
          accentClass={card.accentClass}
          borderClass={card.borderClass}
          ctaLabel={card.ctaLabel}
          onCta={onOpenPlans}
          ctaDisabled={ctaDisabled}
          loading={loading}
          className={rowOnTablet ? 'sm:flex-1' : undefined}
        />
      ))}
    </div>
  );
}
