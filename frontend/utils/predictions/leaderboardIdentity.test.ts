import { describe, expect, it } from 'vitest';
import {
  getLeaderboardIdentity,
  getLeaderboardRowPresentation,
  getMaskedAnalystDisplayName,
  shouldMaskLeaderboardEntry,
} from '@/utils/predictions/leaderboardIdentity';
import type { LeaderboardEntry } from '@/types/predictions';

const SAMPLE_ENTRY: LeaderboardEntry = {
  rank: 3,
  displayName: 'Maya Chen',
  handle: 'mayacrypto',
  score: 80,
  winRatePercent: 72,
  predictionsCount: 10,
  verifiedCount: 7,
  avatar: 'https://example.com/maya.png',
  avatarInitials: 'MC',
};

describe('getMaskedAnalystDisplayName', () => {
  it('returns Analyst_{rank} for a valid rank', () => {
    expect(getMaskedAnalystDisplayName(1)).toBe('Analyst_1');
    expect(getMaskedAnalystDisplayName(12)).toBe('Analyst_12');
  });
});

describe('getLeaderboardIdentity', () => {
  it('keeps real identity when not masking', () => {
    expect(getLeaderboardIdentity(SAMPLE_ENTRY, false)).toEqual({
      displayName: 'Maya Chen',
      handle: 'mayacrypto',
      avatarSrc: 'https://example.com/maya.png',
      avatarAlt: 'Maya Chen',
    });
  });

  it('hides photo and real name when masking', () => {
    expect(getLeaderboardIdentity(SAMPLE_ENTRY, true)).toEqual({
      displayName: 'Analyst_3',
      handle: null,
      avatarSrc: undefined,
      avatarAlt: 'Analyst_3',
      avatarFallbackText: 'MC',
    });
  });

  it('falls back to ? when avatar initials are missing', () => {
    const withoutInitials = { ...SAMPLE_ENTRY, avatarInitials: undefined };
    expect(getLeaderboardIdentity(withoutInitials, true).avatarFallbackText).toBe(
      '?'
    );
  });
});

describe('shouldMaskLeaderboardEntry', () => {
  it('masks other analysts and not the viewer', () => {
    expect(shouldMaskLeaderboardEntry(SAMPLE_ENTRY, true, 'otheruser')).toBe(true);
    expect(shouldMaskLeaderboardEntry(SAMPLE_ENTRY, true, 'MayaCrypto')).toBe(false);
  });
});

describe('getLeaderboardRowPresentation', () => {
  it('keeps the viewer own row unmasked', () => {
    const presentation = getLeaderboardRowPresentation(
      SAMPLE_ENTRY,
      true,
      'mayacrypto'
    );
    expect(presentation.isOwnRow).toBe(true);
    expect(presentation.maskThisRow).toBe(false);
    expect(presentation.identity.displayName).toBe('Maya Chen');
  });
});
