import { computeRiskReward } from '@/utils/predictions/predictionRules';
import { formatPercent } from '@/utils/predictions/predictionFormFormat';

export interface TradeLevelMetrics {
  riskRewardText: string;
  potentialUpside: number;
  potentialDownside: number;
  potentialUpsideText: string;
  potentialDownsideText: string;
}

/** Derive RR / upside / downside display values from trade levels. */
export function computeTradeLevelMetrics(
  entryPrice: number,
  targetPrice: number,
  stopLoss: number
): TradeLevelMetrics {
  const entry = entryPrice || 0;
  const target = targetPrice || 0;
  const stop = stopLoss || 0;
  const riskReward = computeRiskReward(entry, target, stop);
  const potentialUpside = entry > 0 ? ((target - entry) / entry) * 100 : 0;
  const potentialDownside = entry > 0 ? ((stop - entry) / entry) * 100 : 0;

  return {
    riskRewardText: Number.isNaN(riskReward) ? '-' : riskReward.toFixed(2),
    potentialUpside,
    potentialDownside,
    potentialUpsideText: formatPercent(potentialUpside),
    potentialDownsideText: formatPercent(potentialDownside),
  };
}
