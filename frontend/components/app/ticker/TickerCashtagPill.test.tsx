/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TickerCashtagPill from './TickerCashtagPill';

afterEach(cleanup);

describe('TickerCashtagPill', () => {
  it('links to the ticker page and shows the cashtag', () => {
    render(<TickerCashtagPill tag="$btc" />);
    const link = screen.getByRole('link', { name: '$BTC' });
    expect(link).toHaveAttribute('href', '/ticker/BTC');
    expect(screen.getByText('$BTC')).toBeInTheDocument();
  });

  it('does not open the surrounding card when clicked', () => {
    const onCardClick = vi.fn();
    render(
      <p onClick={onCardClick}>
        <TickerCashtagPill tag="$ETH" />
      </p>
    );
    fireEvent.click(screen.getByRole('link', { name: '$ETH' }));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('renders without a link when not interactive', () => {
    render(<TickerCashtagPill tag="$SOL" interactive={false} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('$SOL')).toBeInTheDocument();
  });

  it('renders nothing for an invalid cashtag', () => {
    const { container } = render(<TickerCashtagPill tag="BTC" />);
    expect(container).toBeEmptyDOMElement();
  });
});
