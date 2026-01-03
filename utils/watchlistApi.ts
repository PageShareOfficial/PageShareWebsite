// Utility functions for updating watchlist items with real-time prices

import { WatchlistItem } from '@/types';
import { fetchTickerData } from './stockApi';

// Update all watchlist items with latest prices
export async function updateWatchlistPrices(
  watchlist: WatchlistItem[]
): Promise<WatchlistItem[]> {
  // Update prices in parallel (with rate limiting consideration)
  const updatePromises = watchlist.map(async (item) => {
    try {
      const tickerData = await fetchTickerData(item.ticker);
      
      if (tickerData) {
        return {
          ...item,
          price: tickerData.price,
          change: tickerData.change,
          name: tickerData.name, // Update name in case it changed
        };
      }
      
      // If fetch fails, return original item
      return item;
    } catch (error) {
      console.error(`Error updating price for ${item.ticker}:`, error);
      // Return original item if update fails
      return item;
    }
  });
  
  // Add a small delay between batches to avoid rate limiting
  const batchSize = 5;
  const updatedWatchlist: WatchlistItem[] = [];
  
  for (let i = 0; i < updatePromises.length; i += batchSize) {
    const batch = updatePromises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    updatedWatchlist.push(...batchResults);
    
    // Small delay between batches (CoinGecko allows 10-50 calls/minute)
    if (i + batchSize < updatePromises.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return updatedWatchlist;
}

// Update a single watchlist item
export async function updateWatchlistItem(
  item: WatchlistItem
): Promise<WatchlistItem> {
  try {
    const tickerData = await fetchTickerData(item.ticker);
    
    if (tickerData) {
      return {
        ...item,
        price: tickerData.price,
        change: tickerData.change,
        name: tickerData.name,
      };
    }
    
    return item;
  } catch (error) {
    console.error(`Error updating price for ${item.ticker}:`, error);
    return item;
  }
}

