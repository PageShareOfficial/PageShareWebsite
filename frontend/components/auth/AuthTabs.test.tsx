/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthTabs from './AuthTabs';
import {
  REMEMBERED_ACCOUNT_STORAGE_KEY,
  type RememberedAccount,
} from '@/utils/auth/rememberedAccount';

const signInWithGoogle = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signInWithGoogle, signInWithEmail: vi.fn(), signUpWithEmail: vi.fn() }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('./ForgotPasswordForm', () => ({ default: () => null }));
vi.mock('./EmailSignUpForm', () => ({ default: () => <div>sign-up form</div> }));

function remember(account: RememberedAccount) {
  window.localStorage.setItem(REMEMBERED_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
}

const googleAccount: RememberedAccount = {
  method: 'google',
  email: 'alice@gmail.com',
  displayName: 'Alice',
  avatarUrl: null,
};

describe('AuthTabs', () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInWithGoogle.mockReset().mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it('defaults to sign-in with a link to create an account for a new visitor', () => {
    render(<AuthTabs />);
    expect(screen.getByText('Welcome to PageShare')).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText('New here?')).toBeInTheDocument();
    expect(screen.queryByText('sign-up form')).not.toBeInTheDocument();
  });

  it('swaps to the sign-up form and back', () => {
    render(<AuthTabs />);

    fireEvent.click(screen.getByText('Create account'));
    expect(screen.getByText('sign-up form')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Sign in'));
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('shows only a Continue button for a remembered Google account', async () => {
    remember(googleAccount);
    render(<AuthTabs />);

    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
    expect(signInWithGoogle).toHaveBeenCalledWith({ loginHint: 'alice@gmail.com' });
  });

  it('shows a pre-filled password form for a remembered email account', async () => {
    remember({ ...googleAccount, method: 'email', email: 'alice@example.com' });
    render(<AuthTabs />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('alice@example.com')
    );
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
  });

  it('offers no way to create another account on the Welcome back screen', async () => {
    remember(googleAccount);
    render(<AuthTabs />);

    await screen.findByText('Welcome back');
    expect(screen.queryByText('New here?')).not.toBeInTheDocument();
    expect(screen.queryByText('Create account')).not.toBeInTheDocument();
  });

  it('opens sign-up from Get Started for a new visitor', () => {
    render(<AuthTabs />);

    act(() => {
      window.dispatchEvent(new Event('pageshare:open-signup'));
    });

    expect(screen.getByText('sign-up form')).toBeInTheDocument();
  });

  it('keeps the Welcome back screen on Get Started for a remembered account', async () => {
    remember(googleAccount);
    render(<AuthTabs />);
    await screen.findByText('Welcome back');

    act(() => {
      window.dispatchEvent(new Event('pageshare:open-signup'));
    });

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByText('sign-up form')).not.toBeInTheDocument();
  });
});
