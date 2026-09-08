import { describe, expect, it } from 'vitest';
import {
  OWN_ROW_BORDER_COLOR,
  PODIUM_RANK_COLORS,
  getOwnYouBadgeStyle,
  getPodiumBorderStyle,
  getPodiumRowClass,
  shouldHighlightOwnLeaderboardRow,
} from '@/utils/predictions/leaderboardStyles';

describe('shouldHighlightOwnLeaderboardRow', () => {
  it('highlights only the viewer own non-podium row', () => {
    expect(shouldHighlightOwnLeaderboardRow(4, true)).toBe(true);
    expect(shouldHighlightOwnLeaderboardRow(1, true)).toBe(false);
    expect(shouldHighlightOwnLeaderboardRow(4, false)).toBe(false);
  });
});

describe('getPodiumBorderStyle', () => {
  it('keeps podium colors over own-row cyan', () => {
    expect(getPodiumBorderStyle(1, { highlightOwn: true })).toEqual({
      borderColor: PODIUM_RANK_COLORS[1],
    });
  });

  it('uses cyan for own non-podium rows', () => {
    expect(getPodiumBorderStyle(5, { highlightOwn: true })).toEqual({
      borderColor: OWN_ROW_BORDER_COLOR,
    });
  });
});

describe('getPodiumRowClass', () => {
  it('uses cyan border classes for own non-podium rows', () => {
    expect(getPodiumRowClass(6, { highlightOwn: true })).toContain('border-cyan');
  });
});

describe('getOwnYouBadgeStyle', () => {
  it('uses podium fill and black text for top 3', () => {
    expect(getOwnYouBadgeStyle(1)).toEqual({
      backgroundColor: PODIUM_RANK_COLORS[1],
      color: '#000000',
    });
    expect(getOwnYouBadgeStyle(2)).toEqual({
      backgroundColor: PODIUM_RANK_COLORS[2],
      color: '#000000',
    });
    expect(getOwnYouBadgeStyle(3)).toEqual({
      backgroundColor: PODIUM_RANK_COLORS[3],
      color: '#000000',
    });
  });

  it('uses cyan fill and black text outside the podium', () => {
    expect(getOwnYouBadgeStyle(7)).toEqual({
      backgroundColor: OWN_ROW_BORDER_COLOR,
      color: '#000000',
    });
  });
});
