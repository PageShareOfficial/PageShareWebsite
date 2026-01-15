// Utility functions for updating watchlist items with real-time prices
// Uses the same simple approach as adding stocks: fetchTickerData

import { WatchlistItem } from '@/types';
import { fetchTickerData } from './stockApi';

// Update all watchlist items with latest prices
export async function updateWatchlistPrices(
  watchlist: WatchlistItem[]
): Promise<WatchlistItem[]> {
  const updatedItems = await Promise.all(
    watchlist.map(async (item) => {
      try {
        const tickerData = await fetchTickerData(item.ticker);
        if (tickerData) {
          return {
            ...item,
            price: tickerData.price,
            change: tickerData.change,
            name: tickerData.name,
            image: tickerData.image || item.image,
          };
        }
        return item;
      } catch (error) {
        console.error(`Error updating ${item.ticker}:`, error);
        return item;
      }
    })
  );
  
  return updatedItems;
}

