import { describe, expect, it } from 'vitest';
import { toFriendlySignInError, UNCONFIRMED_EMAIL_MESSAGE } from './signInErrors';

describe('toFriendlySignInError', () => {
  it.each(['Email not confirmed', 'token_not_found', 'Invalid Refresh Token: not found'])(
    'maps "%s" to the confirm-your-email message',
    (message) => {
      expect(toFriendlySignInError(message)).toBe(UNCONFIRMED_EMAIL_MESSAGE);
    }
  );

  it('keeps other messages unchanged', () => {
    expect(toFriendlySignInError('Invalid login credentials')).toBe('Invalid login credentials');
  });
});
