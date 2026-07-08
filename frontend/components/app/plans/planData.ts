import type { BillingInterval, PlanId } from '@/types/billing';

export type { BillingInterval, PlanId };
export type PlanTheme = PlanId;
export interface PlanPricing {
  original: number;
  discounted: number;
}

export interface PlanDefinition {
  id: PlanTheme;
  theme: PlanTheme;
  tickLabel: string;
  roleTitle: string;
  tagline: string;
  badge: string;
  pricing: {
    monthly: PlanPricing;
    yearly: PlanPricing;
  };
  features: string[];
  ctaLabel: string;
}

export const YEARLY_DISCOUNT_PERCENT = 40;

export const PLANS: PlanDefinition[] = [
  {
    id: 'analyst',
    theme: 'analyst',
    tickLabel: 'Blue Tick',
    roleTitle: 'Analyst / Trader',
    tagline: 'Build Credibility. Publish Predictions. Grow Your Influence.',
    badge: 'ONE BEST PLAN',
    pricing: {
      monthly: { original: 499, discounted: 299 },
      yearly: { original: 5999, discounted: 3599 },
    },
    features: [
      'Publish Your Predictions',
      'Extended posts & comments — up to 10,000 characters',
      'Advanced Prediction Analytics',
      'Performance Scorecard & History',
      'Evidence & Confidence Engine',
      'Priority Visibility in Discovery',
      'Early Access to AI Research Tools',
      'Custom Analyst Profile & Branding',
      'Priority Support',
    ],
    ctaLabel: 'Start as Analyst',
  },
  {
    id: 'investor',
    theme: 'investor',
    tickLabel: 'Green Tick',
    roleTitle: 'Investor',
    tagline: 'Discover Real Signal. Track Performance. Invest Smarter.',
    badge: 'ONE BEST PLAN',
    pricing: {
      monthly: { original: 1999, discounted: 1199 },
      yearly: { original: 23999, discounted: 14399 },
    },
    features: [
      'Unlimited Analyst Scorecards',
      'Extended posts & comments — up to 10,000 characters',
      'Advanced Performance Analytics',
      'Prediction History & Outcomes',
      'Smart Watchlists & Alerts',
      'Market Intelligence Dashboard',
      'AI-Powered Analyst Ranking',
      'Portfolio & Risk Insights (Soon)',
      'Priority Support',
    ],
    ctaLabel: 'Start as Investor',
  },
];

export const TRUST_PILLARS = [
  {
    title: 'Locked Predictions',
    description: 'Immutable records. No edits. No deletes.',
    accent: 'violet',
    icon: 'lock',
  },
  {
    title: 'Verified Performance',
    description: 'Every analyst. Every call. Fully trackable.',
    accent: 'blue',
    icon: 'badge-check',
  },
  {
    title: 'Evidence-Based Trust',
    description: 'Decisions backed by real data, not hype.',
    accent: 'emerald',
    icon: 'bar-chart',
  },
  {
    title: 'Your Edge. Your Way.',
    description: 'Powerful tools for serious market players.',
    accent: 'amber',
    icon: 'sparkles',
  },
] as const;
