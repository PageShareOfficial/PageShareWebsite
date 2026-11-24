export type NetworkStatsPlacement = 'mobile' | 'tablet';

const PLACEMENT_VISIBILITY: Record<NetworkStatsPlacement, string> = {
  mobile: 'md:hidden',
  tablet: 'hidden md:block lg:hidden',
};

const PLACEMENT_SPACING: Record<NetworkStatsPlacement, string> = {
  mobile: 'px-3 py-3',
  tablet: 'mt-3 pb-3',
};

export function getNetworkStatsSectionClassName(placement: NetworkStatsPlacement): string {
  return [
    PLACEMENT_VISIBILITY[placement],
    'shrink-0 border-b border-white/10',
    PLACEMENT_SPACING[placement],
  ].join(' ');
}
