// Utility functions for fetching real-time stock and crypto data
//
// API Setup:
// 1. For Stocks: Optional - Add NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY to .env.local
//    - Get free API key from https://www.alphavantage.co/support/#api-key
//    - Free tier: 5 API calls/minute, 500 calls/day
//    - If not provided, falls back to Yahoo Finance (free, no API key needed)
//
// 2. For Crypto: No setup needed!
//    - Uses CoinGecko API (free, no API key required)
//    - Free tier: 10-50 calls/minute
//
// Note: Yahoo Finance data is proxied through Next.js API route (/api/stock/[ticker])
// to avoid CORS issues when calling from the browser.

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number; // percentage change
  changeAmount?: number; // absolute change
}

// Fetch stock data using Alpha Vantage API
export async function fetchStockData(ticker: string): Promise<StockData | null> {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    console.warn('Alpha Vantage API key not found. Using fallback method.');
    // Fallback: Try Yahoo Finance via a CORS proxy or alternative method
    return fetchStockDataAlternative(ticker);
  }

  try {
    // Alpha Vantage Global Quote endpoint
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Alpha Vantage returns data in 'Global Quote' object
    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      // Try alternative method if Alpha Vantage doesn't have the ticker
      return fetchStockDataAlternative(ticker);
    }
    
    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const changeAmount = price - previousClose;
    const changePercent = ((changeAmount / previousClose) * 100);
    
    // Alpha Vantage doesn't provide company name in GLOBAL_QUOTE endpoint
    // Use ticker as name (users can see full name via alternative method if they don't have API key)
    const name = quote['01. symbol'] || ticker;
    
    return {
      ticker: ticker.toUpperCase(),
      name: name, // Will show ticker symbol as name when using Alpha Vantage
      price: price,
      change: changePercent,
      changeAmount: changeAmount,
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${ticker}:`, error);
    return fetchStockDataAlternative(ticker);
  }
}

// Alternative method: Fetch from Yahoo Finance via Next.js API route (to avoid CORS)
// Note: This will call a backend API route that proxies the request
async function fetchStockDataAlternative(ticker: string): Promise<StockData | null> {
  try {
    // Call our Next.js API route which will proxy the Yahoo Finance request
    // This avoids CORS issues
    const response = await fetch(`/api/stock/${ticker.toUpperCase()}`);
    
    if (!response.ok) {
      // If API route doesn't exist or fails, return null
      return null;
    }
    
    const data = await response.json();
    
    if (!data.price || !data.change) {
      return null;
    }
    
    return {
      ticker: ticker.toUpperCase(),
      name: data.name || ticker,
      price: data.price,
      change: data.change,
      changeAmount: data.changeAmount,
    };
  } catch (error) {
    console.error(`Error fetching stock data (alternative) for ${ticker}:`, error);
    return null;
  }
}

// Fetch crypto data using CoinGecko API (free, no API key needed for basic usage)
export async function fetchCryptoData(ticker: string): Promise<StockData | null> {
  try {
    // CoinGecko API - map common tickers to coin IDs
    const tickerToCoinId: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'LTC': 'litecoin',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'ETC': 'ethereum-classic',
      'XLM': 'stellar',
      'ALGO': 'algorand',
      'VET': 'vechain',
      'ICP': 'internet-computer',
    };
    
    const coinId = tickerToCoinId[ticker.toUpperCase()];
    
    if (!coinId) {
      // If not in our mapping, try to search for it
      return await fetchCryptoDataBySearch(ticker);
    }
    
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=false&include_last_updated_at=false`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data[coinId]) {
      return null;
    }
    
    const coinData = data[coinId];
    const price = coinData.usd;
    const changePercent = coinData.usd_24h_change || 0;
    
    // Get coin name
    const coinName = await getCryptoName(coinId);
    
    return {
      ticker: ticker.toUpperCase(),
      name: coinName || ticker,
      price: price,
      change: changePercent,
    };
  } catch (error) {
    console.error(`Error fetching crypto data for ${ticker}:`, error);
    return null;
  }
}

// Fetch crypto by searching CoinGecko
async function fetchCryptoDataBySearch(ticker: string): Promise<StockData | null> {
  try {
    // Search for the coin
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${ticker.toLowerCase()}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.coins || searchData.coins.length === 0) {
      return null;
    }
    
    // Use the first result
    const coin = searchData.coins[0];
    const coinId = coin.id;
    
    // Fetch price data
    const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    const priceResponse = await fetch(priceUrl);
    
    if (!priceResponse.ok) {
      return null;
    }
    
    const priceData = await priceResponse.json();
    
    if (!priceData[coinId]) {
      return null;
    }
    
    const coinPriceData = priceData[coinId];
    const price = coinPriceData.usd;
    const changePercent = coinPriceData.usd_24h_change || 0;
    
    return {
      ticker: ticker.toUpperCase(),
      name: coin.name || ticker,
      price: price,
      change: changePercent,
    };
  } catch (error) {
    console.error(`Error searching crypto for ${ticker}:`, error);
    return null;
  }
}

// Get crypto name from coin ID
async function getCryptoName(coinId: string): Promise<string | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.name || null;
  } catch (error) {
    console.error(`Error fetching crypto name for ${coinId}:`, error);
    return null;
  }
}

// Determine if a ticker is crypto or stock and fetch accordingly
export async function fetchTickerData(ticker: string): Promise<StockData | null> {
  // Common crypto tickers (you can expand this list)
  const cryptoCheck = await fetchCryptoData(ticker);
  if (cryptoCheck) {
    return cryptoCheck;
  }
  
  // Try as stock
  const stockCheck = await fetchStockData(ticker);
  if (stockCheck) {
    return stockCheck;
  }
  
  return null;
}

// Search interface for autocomplete suggestions
export interface SearchSuggestion {
  ticker: string;
  name: string;
  type: 'stock' | 'crypto';
}

// Search for stocks by name or ticker using Alpha Vantage
export async function searchStocks(query: string): Promise<SearchSuggestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  const normalizedQuery = query.trim().toUpperCase();
  
  if (!normalizedQuery) {
    return [];
  }

  // If query looks like a ticker (short, uppercase), try direct lookup first
  if (normalizedQuery.length <= 5 && /^[A-Z]+$/.test(normalizedQuery)) {
    try {
      const stockData = await fetchStockData(normalizedQuery);
      if (stockData) {
        return [{
          ticker: stockData.ticker,
          name: stockData.name,
          type: 'stock',
        }];
      }
    } catch (error) {
      // Continue to search if direct lookup fails
    }
  }

  // For name-based search, use Yahoo Finance search via our API route
  try {
    const response = await fetch(`/api/stock/search?q=${encodeURIComponent(normalizedQuery)}`);
    if (response.ok) {
      const data = await response.json();
      return data.suggestions || [];
    }
  } catch (error) {
    console.error('Error searching stocks:', error);
  }

  return [];
}

// Search for cryptocurrencies by name or ticker using CoinGecko
export async function searchCrypto(query: string): Promise<SearchSuggestion[]> {
  const normalizedQuery = query.trim().toLowerCase();
  
  if (!normalizedQuery) {
    return [];
  }

  try {
    // CoinGecko search endpoint
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(normalizedQuery)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.coins || data.coins.length === 0) {
      return [];
    }
    
    // Map CoinGecko results to our format
    // Limit to top 10 results
    return data.coins.slice(0, 10).map((coin: any) => ({
      ticker: coin.symbol.toUpperCase(),
      name: coin.name,
      type: 'crypto' as const,
    }));
  } catch (error) {
    console.error('Error searching crypto:', error);
    return [];
  }
}

// Combined search for both stocks and crypto
export async function searchTickers(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim()) {
    return [];
  }

  // Search both in parallel
  const [stockResults, cryptoResults] = await Promise.all([
    searchStocks(query),
    searchCrypto(query),
  ]);

  // Combine and limit total results
  const combined = [...stockResults, ...cryptoResults];
  return combined.slice(0, 10); // Limit to 10 total suggestions
}

