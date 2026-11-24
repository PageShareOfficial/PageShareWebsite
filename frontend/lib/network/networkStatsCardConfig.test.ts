import { describe, expect, it } from 'vitest';
import {
  buildInvestorNetworkCard,
  buildNetworkStatsCardDefinitions,
  investorCountLabel,
} from '@/lib/network/networkStatsCardConfig';
import type { NetworkStats } from '@/lib/api/networkApi';

const sampleStats: NetworkStats = {
  total_predictions: 10,
  verified_predictions: 8,
  publishing_analysts: 2,
  saved_analysts: 3,
  saving_investors: 1,
};

describe('investorCountLabel', () => {
  it('singular at 1', () => {
    expect(investorCountLabel(1)).toBe('Investor');
  });

  it('plural otherwise', () => {
    expect(investorCountLabel(0)).toBe('Investors');
    expect(investorCountLabel(2)).toBe('Investors');
  });
});

describe('buildNetworkStatsCardDefinitions', () => {
  it('returns analyst and investor cards', () => {
    const cards = buildNetworkStatsCardDefinitions(sampleStats);
    expect(cards).toHaveLength(2);
    expect(cards[0]?.title).toBe('Analysts Corner');
    expect(cards[1]?.title).toBe('Investors Corner');
  });

  it('maps investor column label from count', () => {
    const investor = buildInvestorNetworkCard(sampleStats);
    expect(investor.columns[1]?.label).toBe('Investor');
  });
});
