/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AccountLoadError } from '@/utils/auth/accountLoadError';
import AccountErrorPage from './page';

const replace = vi.hoisted(() => vi.fn());
const getSession = vi.hoisted(() => vi.fn());
const resolvePostAuthPath = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getSession } }),
}));
vi.mock('@/utils/auth/postAuthRedirect', () => ({ resolvePostAuthPath }));

function signedInSession() {
  getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
}

describe('AccountErrorPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('sends the user on when the profile loads', async () => {
    signedInSession();
    resolvePostAuthPath.mockResolvedValue('/home');
    render(<AccountErrorPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });

    expect(resolvePostAuthPath).toHaveBeenCalledWith('token');
    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('returns to the landing page when the session is gone', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    render(<AccountErrorPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });

    expect(resolvePostAuthPath).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/?error=auth');
  });

  it('stays on the retry view when the account still cannot be loaded', async () => {
    signedInSession();
    resolvePostAuthPath.mockRejectedValue(new AccountLoadError());
    render(<AccountErrorPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  it('logs an unexpected retry failure and stays on the page', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    signedInSession();
    resolvePostAuthPath.mockRejectedValue(new Error('network'));
    render(<AccountErrorPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });

    expect(replace).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
