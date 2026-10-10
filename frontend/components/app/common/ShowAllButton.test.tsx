/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ShowMoreToggleButton } from './ShowAllButton';

describe('ShowMoreToggleButton', () => {
  afterEach(cleanup);

  it('offers "Show more" while collapsed and calls onToggle', () => {
    const onToggle = vi.fn();
    render(<ShowMoreToggleButton expanded={false} onToggle={onToggle} />);
    const button = screen.getByRole('button', { name: 'Show more' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('offers "Show less" while expanded', () => {
    render(<ShowMoreToggleButton expanded onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});
