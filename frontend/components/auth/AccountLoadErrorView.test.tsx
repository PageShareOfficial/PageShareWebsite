/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import AccountLoadErrorView from './AccountLoadErrorView';
import { ROUTES } from '@/constants/routes';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('AccountLoadErrorView', () => {
  afterEach(cleanup);

  it('explains the failure and links back home', () => {
    render(<AccountLoadErrorView onRetry={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText("Couldn't load your account")).toBeInTheDocument();
    expect(screen.getByText('Back to home').closest('a')).toHaveAttribute('href', ROUTES.landing);
  });

  it('disables the button while retrying and re-enables it afterwards', async () => {
    let finishRetry: () => void = () => {};
    const onRetry = vi.fn(() => new Promise<void>((resolve) => (finishRetry = resolve)));
    render(<AccountLoadErrorView onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Retrying...' })).toBeDisabled();

    await act(async () => finishRetry());
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });
});
