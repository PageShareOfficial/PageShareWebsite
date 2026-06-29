export type VerifiedTickVariant = 'analyst' | 'investor';

/** Hex colors for blue (analyst) and green (investor) verified ticks. */
export const VERIFIED_TICK_COLORS: Record<VerifiedTickVariant, string> = {
  analyst: '#3b82f6',
  investor: '#10b981',
};

export const ANALYST_TICK_COLOR = VERIFIED_TICK_COLORS.analyst;
export const INVESTOR_TICK_COLOR = VERIFIED_TICK_COLORS.investor;
