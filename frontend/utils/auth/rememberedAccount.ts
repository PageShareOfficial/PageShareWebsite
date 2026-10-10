import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * "Continue as …" hint for returning visitors on this browser.
 * Stores only display info (never tokens), so it is safe to keep after sign-out.
 */
export type RememberedAuthMethod = 'google' | 'email';

export interface RememberedAccount {
  method: RememberedAuthMethod;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export const REMEMBERED_ACCOUNT_STORAGE_KEY = 'pageshare:remembered-account';

type ProfileHint = { display_name?: string | null; profile_picture_url?: string | null } | null;

function isRememberedAuthMethod(value: unknown): value is RememberedAuthMethod {
  return value === 'google' || value === 'email';
}

/** The method used for the most recent sign-in (identity with the latest last_sign_in_at). */
export function getLastUsedAuthMethod(user: SupabaseUser): RememberedAuthMethod | null {
  const latestIdentity = [...(user.identities ?? [])].sort((first, second) =>
    (second.last_sign_in_at ?? '').localeCompare(first.last_sign_in_at ?? '')
  )[0];
  const provider = latestIdentity?.provider ?? user.app_metadata?.provider;
  return isRememberedAuthMethod(provider) ? provider : null;
}

function pickString(...values: unknown[]): string | null {
  const found = values.find((value) => typeof value === 'string' && value.trim() !== '');
  return typeof found === 'string' ? found.trim() : null;
}

export function buildRememberedAccount(
  user: SupabaseUser,
  profile: ProfileHint
): RememberedAccount | null {
  const method = getLastUsedAuthMethod(user);
  if (!method || !user.email) return null;
  const metadata = user.user_metadata ?? {};
  return {
    method,
    email: user.email,
    displayName:
      pickString(profile?.display_name, metadata.full_name, metadata.name) ??
      user.email.split('@')[0],
    avatarUrl: pickString(profile?.profile_picture_url, metadata.avatar_url, metadata.picture),
  };
}

function parseRememberedAccount(raw: string | null): RememberedAccount | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RememberedAccount>;
    if (!isRememberedAuthMethod(value.method)) return null;
    if (typeof value.email !== 'string' || typeof value.displayName !== 'string') return null;
    return {
      method: value.method,
      email: value.email,
      displayName: value.displayName,
      avatarUrl: typeof value.avatarUrl === 'string' ? value.avatarUrl : null,
    };
  } catch {
    return null;
  }
}

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readRememberedAccount(storage = getStorage()): RememberedAccount | null {
  return parseRememberedAccount(storage?.getItem(REMEMBERED_ACCOUNT_STORAGE_KEY) ?? null);
}

export function saveRememberedAccount(account: RememberedAccount, storage = getStorage()): void {
  try {
    storage?.setItem(REMEMBERED_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  } catch {
    // Storage full or blocked (private mode): the hint is optional.
  }
}

export function forgetRememberedAccount(storage = getStorage()): void {
  try {
    storage?.removeItem(REMEMBERED_ACCOUNT_STORAGE_KEY);
  } catch {
    // Storage blocked: nothing stored to forget.
  }
}
