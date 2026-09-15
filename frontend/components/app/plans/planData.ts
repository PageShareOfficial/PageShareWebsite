import type { BillingInterval, PlanId } from '@/types/billing';

export type { BillingInterval, PlanId };
export type PlanTheme = PlanId;

/** Monthly plan: single list price, no strikethrough. */
export interface MonthlyPlanPricing {
  amount: number;
}

/**
 * Yearly plan: shown as a monthly-equivalent rate with months-free savings.
 * Analyst: $199/mo billed yearly ($2,388) vs $299×12 → 4 months free.
 * Investor: $999/mo billed yearly ($11,988) vs $1,199×12 → ~2 months free.
 */
export interface YearlyPlanPricing {
  amountPerMonth: number;
  discount: number;
}

export interface PlanDefinition {
  id: PlanTheme;
  theme: PlanTheme;
  tickLabel: string;
  roleTitle: string;
  tagline: string;
  pricing: {
    monthly: MonthlyPlanPricing;
    yearly: YearlyPlanPricing;
  };
  features: string[];
  ctaLabel: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'analyst',
    theme: 'analyst',
    tickLabel: 'Blue Tick',
    roleTitle: 'Analyst / Trader',
    tagline: 'Build Credibility. Publish Predictions. Grow Your Influence.',
    pricing: {
      monthly: { amount: 79 },
      yearly: { amountPerMonth: 59, discount: 25 },
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
    pricing: {
      monthly: { amount: 999 },
      yearly: { amountPerMonth: 799, discount: 20 },
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

export type { PlanFaqItem } from './planFaqs';
export { PLAN_FAQS } from './planFaqs';
