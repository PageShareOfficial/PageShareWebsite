import { describe, expect, it } from 'vitest';
import {
  computeOverlapProgress,
  computeStackingCardTransform,
  transformFromOverlapProgress,
} from '@/utils/landing/stackingCardTransform';

describe('computeOverlapProgress', () => {
  const cardHeight = 400;
  const stickyTop = 80;
  const thresholdTop = stickyTop + cardHeight * 0.8;

  it('returns 0 when next card has not entered overlap zone', () => {
    expect(computeOverlapProgress(cardHeight, stickyTop, thresholdTop)).toBe(0);
  });

  it('returns 1 at full overlap', () => {
    const nextTop = stickyTop + cardHeight * 0.8 - cardHeight * 0.85;
    expect(computeOverlapProgress(cardHeight, stickyTop, nextTop)).toBe(1);
  });
});

describe('transformFromOverlapProgress', () => {
  it('returns identity at zero progress', () => {
    expect(transformFromOverlapProgress(0)).toEqual({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  });
});

describe('computeStackingCardTransform', () => {
  it('returns identity when there is no next card', () => {
    expect(computeStackingCardTransform(400, 80, null)).toEqual({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  });

  it('computes overlap when next card top is 0 (not confused with null)', () => {
    expect(computeStackingCardTransform(400, 80, 0)).toEqual(
      transformFromOverlapProgress(computeOverlapProgress(400, 80, 0))
    );
  });
});
