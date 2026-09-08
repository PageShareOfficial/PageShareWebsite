export interface PlanFaqItem {
  question: string;
  answer: string;
}

/** Product-specific answers for the plans page — not generic SaaS filler. */
export const PLAN_FAQS: PlanFaqItem[] = [
  {
    question: "What's the difference between Analyst and Investor?",
    answer:
      'Analyst is for people who publish predictions and build a public track record (Blue Tick). Investor is for people who research analysts, scorecards, and performance history to find signal (Green Tick). Pick the seat that matches how you use PageShare.',
  },
  {
    question: 'Can I move from Analyst to Investor (or the other way)?',
    answer:
      "Not while an active subscription is running. You can change monthly or yearly on the same plan type anytime. Analyst and Investor are separate products, so switching seats isn't done as an in-place upgrade.",
  },
  {
    question: 'Why is yearly cheaper, and what does "months free" mean?',
    answer:
      'Yearly is billed once for 12 months at a lower effective monthly rate. Analyst yearly equals about 4 months free versus paying monthly; Investor yearly equals about 2 months free. The large price on the card is the monthly equivalent; Stripe charges the annual total at checkout.',
  },
  {
    question: 'What if I switch from monthly to yearly in the middle of my plan?',
    answer:
      'Your subscription updates in place - you keep premium access with no gap. Stripe recalculates the invoice on a prorated basis: unused time on your monthly plan is credited, then the yearly price is charged for the new billing period. The same proration applies if you move yearly back to monthly. You will see the adjusted charge (or credit) on the next invoice in the billing portal.',
  },
  {
    question: "What do I get that free accounts don't?",
    answer:
      'Premium unlocks the seat features on each card (predictions tooling for Analyst, scorecards and research tools for Investor), longer posts and comments (up to 10,000 characters), and priority support. Free accounts stay on the standard feed experience with shorter content limits.',
  },
  {
    question: 'Are predictions editable after I publish them?',
    answer:
      'No. Active predictions are locked for integrity - no silent edits to targets, stops, or thesis after the clock starts. Outcomes are resolved from market data so your scorecard stays comparable over time.',
  },
  {
    question: 'How do I manage billing, invoices, or payment method?',
    answer:
      'Open Manage subscription on your current plan card. That takes you to the secure Stripe customer portal for payment method, invoices, and subscription settings without leaving your PageShare account context.',
  },
  {
    question: 'What happens if payment fails?',
    answer:
      'Stripe retries the charge. You keep access during a short grace window while payment is updated. If the invoice stays unpaid past grace, premium access ends until billing is current again.',
  },
];
