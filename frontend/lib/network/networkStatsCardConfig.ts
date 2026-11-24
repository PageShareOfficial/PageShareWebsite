import { ROUTES } from '@/constants/routes';
import type { StatColumn } from '@/components/app/layout/RightRailNetworkCard';
import type { NetworkStats } from '@/lib/api/networkApi';

export const OUR_NETWORK_SECTION_LABEL = 'Our Network';

export type NetworkStatsCardDefinition = {
  title: string;
  columns: StatColumn[];
  href: string;
  accentClass: string;
  borderClass: string;
  ctaLabel: string;
};

export function investorCountLabel(savingInvestors: number): string {
  return savingInvestors === 1 ? 'Investor' : 'Investors';
}

export function buildAnalystNetworkCard(stats: NetworkStats): NetworkStatsCardDefinition {
  return {
    title: 'Analysts Corner',
    columns: [
      { value: stats.total_predictions, label: 'Submitted' },
      { value: stats.verified_predictions, label: 'Verified' },
      { value: stats.publishing_analysts, label: 'Analysts' },
    ],
    href: ROUTES.predictions,
    accentClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    ctaLabel: 'Submit a Prediction',
  };
}

export function buildInvestorNetworkCard(stats: NetworkStats): NetworkStatsCardDefinition {
  return {
    title: 'Investors Corner',
    columns: [
      { value: stats.saved_analysts, label: 'Saved Analysts' },
      { value: stats.saving_investors, label: investorCountLabel(stats.saving_investors) },
    ],
    href: ROUTES.myAnalysts,
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    ctaLabel: 'View Analytics',
  };
}

export function buildNetworkStatsCardDefinitions(
  stats: NetworkStats,
): NetworkStatsCardDefinition[] {
  return [buildAnalystNetworkCard(stats), buildInvestorNetworkCard(stats)];
}
