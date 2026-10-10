/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import CryptoTickerBar from './CryptoTickerBar';
import type { TopCrypto } from '@/utils/api/topCryptosApi';

const CRYPTOS: TopCrypto[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    imageUrl: 'https://coin-images.coingecko.com/btc.png',
    priceUsd: 65000,
    change24hPercent: 2.5,
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    imageUrl: 'https://coin-images.coingecko.com/eth.png',
    priceUsd: 3200,
    change24hPercent: -1.2,
  },
];

describe('CryptoTickerBar', () => {
  afterEach(cleanup);

  it('renders nothing without data', () => {
    const { container } = render(<CryptoTickerBar cryptos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows each coin once to assistive tech, colored by direction', () => {
    render(<CryptoTickerBar cryptos={CRYPTOS} />);
    const visibleList = screen.getByRole('list');
    const items = within(visibleList).getAllByRole('listitem');
    expect(items).toHaveLength(2);

    expect(within(items[0]).getByText('Bitcoin')).toBeInTheDocument();
    expect(within(items[0]).getByText('+2.50%')).toHaveClass('text-green-500');
    expect(within(items[1]).getByText('-1.20%')).toHaveClass('text-red-500');
  });
});
