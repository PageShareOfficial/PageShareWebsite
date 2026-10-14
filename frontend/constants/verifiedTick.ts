export type VerifiedTickVariant = 'analyst' | 'investor' | 'admin';

/**
 * Hex colors for verified ticks: blue (analyst), green (investor), purple (PageShare admin).
 * Gold is reserved for a future advertiser tier.
 */
export const VERIFIED_TICK_COLORS: Record<VerifiedTickVariant, string> = {
  analyst: '#3b82f6',
  investor: '#10b981',
  admin: '#8B5CF6',
};

export const ANALYST_TICK_COLOR = VERIFIED_TICK_COLORS.analyst;
export const INVESTOR_TICK_COLOR = VERIFIED_TICK_COLORS.investor;
export const ADMIN_TICK_COLOR = VERIFIED_TICK_COLORS.admin;
