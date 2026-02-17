/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UnauthPostView from './UnauthPostView';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}));

vi.mock('./UnauthSidebar', () => ({
  default: () => <div data-testid="unauth-sidebar">Sidebar</div>,
}));

vi.mock('@/components/app/post/PostCard', () => ({
  default: () => <div data-testid="post-card">PostCard</div>,
}));

const mockPost = {
  id: 'post-1',
  author: {
    id: 'user-1',
    displayName: 'Test User',
    handle: 'testuser',
    avatar: '',
  },
  createdAt: '2h',
  createdAtRaw: '2024-01-15T12:00:00.000Z',
  content: 'Test post content',
  stats: { likes: 0, comments: 0, reposts: 0 },
  userInteractions: { liked: false, reposted: false },
};

describe('UnauthPostView', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<UnauthPostView post={mockPost as never} />)
    ).not.toThrow();
  });

  it('shows call to action for unauthenticated users', () => {
    render(<UnauthPostView post={mockPost as never} />);
    const ctas = screen.getAllByText(/Sign in to like, comment, or repost/i);
    expect(ctas.length).toBeGreaterThanOrEqual(1);
    expect(ctas[0]).toBeInTheDocument();
  });

  it('renders Post header', () => {
    render(<UnauthPostView post={mockPost as never} />);
    const headings = screen.getAllByRole('heading', { name: /Post/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(headings[0]).toBeInTheDocument();
  });

  it('includes sidebar', () => {
    render(<UnauthPostView post={mockPost as never} />);
    const sidebars = screen.getAllByTestId('unauth-sidebar');
    expect(sidebars.length).toBeGreaterThanOrEqual(1);
    expect(sidebars[0]).toBeInTheDocument();
  });
});
