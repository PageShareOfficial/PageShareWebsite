import { describe, expect, it } from 'vitest';
import type { SavedAnalyst } from '@/types/savedAnalyst';
import {
  appendSavedAnalyst,
  hasSavedAnalyst,
  removeSavedAnalystByHandle,
  replaceSavedAnalyst,
} from '@/utils/predictions/savedAnalystListUtils';

const sample: SavedAnalyst = {
  id: '1',
  handle: 'alice',
  displayName: 'Alice',
  avatar: '',
};

describe('savedAnalystListUtils', () => {
  it('hasSavedAnalyst detects handle', () => {
    expect(hasSavedAnalyst([sample], 'alice')).toBe(true);
    expect(hasSavedAnalyst([sample], 'bob')).toBe(false);
  });

  it('appendSavedAnalyst dedupes by handle', () => {
    const next = appendSavedAnalyst([sample], { ...sample, id: '2' });
    expect(next).toHaveLength(1);
  });

  it('removeSavedAnalystByHandle drops matching row', () => {
    expect(removeSavedAnalystByHandle([sample], 'alice')).toEqual([]);
  });

  it('replaceSavedAnalyst upserts server row', () => {
    const updated = replaceSavedAnalyst([sample], {
      ...sample,
      id: 'uuid-from-api',
      displayName: 'Alice T.',
    });
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('uuid-from-api');
    expect(updated[0].displayName).toBe('Alice T.');
  });
});
