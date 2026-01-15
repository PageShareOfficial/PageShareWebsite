// Interests options for user profiles and onboarding
export const interestsOptions = [
  'Stocks',
  'ETFs',
  'NFTs',
  'Crypto',
  'Options',
  'Futures',
  'Forex',
  'Commodities',
  'Bonds',
  'Mutual Funds',
] as const;

export type Interest = typeof interestsOptions[number];

