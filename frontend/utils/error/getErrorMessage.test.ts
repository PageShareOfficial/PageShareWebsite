import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  it('returns error.message for Error instances with non-empty message', () => {
    expect(getErrorMessage(new Error('Something failed'), 'Fallback')).toBe('Something failed');
  });

  it('returns fallback for Error with empty message', () => {
    expect(getErrorMessage(new Error(''), 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(new Error('   '), 'Fallback')).toBe('Fallback');
  });

  it('returns trimmed string when error is a string', () => {
    expect(getErrorMessage(' Custom message ', 'Fallback')).toBe('Custom message');
  });

  it('returns fallback for non-Error, non-string (e.g. null, object)', () => {
    expect(getErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(undefined, 'Fallback')).toBe('Fallback');
    expect(getErrorMessage({ code: 500 }, 'Fallback')).toBe('Fallback');
  });
});
