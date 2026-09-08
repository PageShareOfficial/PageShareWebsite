import { describe, expect, it } from 'vitest';
import { resolvePlanCardUiState } from '@/utils/billing/resolvePlanCardUiState';

describe('resolvePlanCardUiState', () => {
  it('marks exact plan and interval as current billing', () => {
    const state = resolvePlanCardUiState(
      { is_premium: true, plan_id: 'analyst', interval: 'monthly' },
      'analyst',
      'monthly'
    );

    expect(state).toEqual({
      isCurrentBilling: true,
      canSwitchInterval: false,
      isCrossPlanLocked: false,
    });
  });

  it('allows interval switch on the same plan type', () => {
    const state = resolvePlanCardUiState(
      { is_premium: true, plan_id: 'investor', interval: 'monthly' },
      'investor',
      'yearly'
    );

    expect(state).toEqual({
      isCurrentBilling: false,
      canSwitchInterval: true,
      isCrossPlanLocked: false,
    });
  });

  it('locks the other plan type while premium', () => {
    const state = resolvePlanCardUiState(
      { is_premium: true, plan_id: 'analyst', interval: 'yearly' },
      'investor',
      'yearly'
    );

    expect(state).toEqual({
      isCurrentBilling: false,
      canSwitchInterval: false,
      isCrossPlanLocked: true,
    });
  });

  it('leaves both cards unlocked for free users', () => {
    const state = resolvePlanCardUiState(
      { is_premium: false, plan_id: null, interval: null },
      'analyst',
      'monthly'
    );

    expect(state).toEqual({
      isCurrentBilling: false,
      canSwitchInterval: false,
      isCrossPlanLocked: false,
    });
  });
});
