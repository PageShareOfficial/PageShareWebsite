import { beforeEach, describe, expect, it } from 'vitest';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  REMEMBERED_ACCOUNT_STORAGE_KEY,
  buildRememberedAccount,
  forgetRememberedAccount,
  getLastUsedAuthMethod,
  readRememberedAccount,
  saveRememberedAccount,
  type RememberedAccount,
} from '@/utils/auth/rememberedAccount';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

function supabaseUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  return {
    id: 'user-1',
    email: 'alice@gmail.com',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Alice Google', avatar_url: 'https://img/google.png' },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as SupabaseUser;
}

const account: RememberedAccount = {
  method: 'google',
  email: 'alice@gmail.com',
  displayName: 'Alice',
  avatarUrl: null,
};

describe('getLastUsedAuthMethod', () => {
  it('picks the identity signed in most recently', () => {
    const user = supabaseUser({
      identities: [
        { provider: 'google', last_sign_in_at: '2026-01-01T00:00:00Z' },
        { provider: 'email', last_sign_in_at: '2026-03-01T00:00:00Z' },
      ] as SupabaseUser['identities'],
    });
    expect(getLastUsedAuthMethod(user)).toBe('email');
  });

  it('falls back to the primary provider and ignores unsupported ones', () => {
    expect(getLastUsedAuthMethod(supabaseUser())).toBe('google');
    expect(getLastUsedAuthMethod(supabaseUser({ app_metadata: { provider: 'github' } }))).toBe(
      null
    );
  });
});

describe('buildRememberedAccount', () => {
  it('prefers the PageShare profile name and picture', () => {
    const result = buildRememberedAccount(supabaseUser(), {
      display_name: 'Alice PS',
      profile_picture_url: 'https://img/ps.png',
    });
    expect(result).toEqual({
      method: 'google',
      email: 'alice@gmail.com',
      displayName: 'Alice PS',
      avatarUrl: 'https://img/ps.png',
    });
  });

  it('falls back to Google metadata, then the email name', () => {
    expect(buildRememberedAccount(supabaseUser(), null)?.displayName).toBe('Alice Google');
    const emailOnly = supabaseUser({ app_metadata: { provider: 'email' }, user_metadata: {} });
    expect(buildRememberedAccount(emailOnly, null)).toMatchObject({
      method: 'email',
      displayName: 'alice',
      avatarUrl: null,
    });
  });

  it('returns null without an email', () => {
    expect(buildRememberedAccount(supabaseUser({ email: undefined }), null)).toBeNull();
  });
});

describe('remembered account storage', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it('saves, reads and forgets the account', () => {
    saveRememberedAccount(account, storage);
    expect(readRememberedAccount(storage)).toEqual(account);

    forgetRememberedAccount(storage);
    expect(readRememberedAccount(storage)).toBeNull();
  });

  it('ignores corrupt or tampered values', () => {
    storage.setItem(REMEMBERED_ACCOUNT_STORAGE_KEY, 'not json');
    expect(readRememberedAccount(storage)).toBeNull();

    storage.setItem(REMEMBERED_ACCOUNT_STORAGE_KEY, JSON.stringify({ ...account, method: 'x' }));
    expect(readRememberedAccount(storage)).toBeNull();
  });

  it('never stores tokens', () => {
    saveRememberedAccount(account, storage);
    expect(storage.getItem(REMEMBERED_ACCOUNT_STORAGE_KEY)).not.toMatch(/token/i);
  });
});
