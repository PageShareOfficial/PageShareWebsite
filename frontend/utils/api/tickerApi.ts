/**
 * API utilities for fetching comprehensive ticker detail data
 * Supports both stocks (Alpha Vantage) and cryptocurrencies (CoinGecko)
 */

import { StockDetailData, CryptoDetailData, TickerType } from '@/types/ticker';
import { fetchStockData, fetchCryptoData } from './stockApi';
import { getStockLogoUrl } from '@/utils/ticker/logoUtils';

/**
 * Helper function to parse numeric string from API response
 */
function parseNumeric(value: string | undefined | null): number | null {
  if (!value || value === 'None' || value === 'N/A' || value.trim() === '') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Helper function to parse date string
 */
function parseDate(value: string | undefined | null): string | null {
  if (!value || value === 'None' || value === 'N/A' || value.trim() === '') {
    return null;
  }
  return value;
}

/**
 * Fetch price data from Alpha Vantage TIME_SERIES_DAILY
 * Gets latest day (current) and previous day (previous close)
 */
async function fetchPriceFromTimeSeries(ticker: string, apiKey: string) {
  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}&outputsize=compact`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data['Error Message'] || data['Note']) return null;
    
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return null;
    
    // Get sorted dates (most recent first)
    const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (dates.length < 2) return null;
    
    // Latest day = current price, previous day = previous close
    const latest = timeSeries[dates[0]];
    const previous = timeSeries[dates[1]];
    
    return {
      price: parseNumeric(latest['4. close']),
      previousClose: parseNumeric(previous['4. close']),
      open: parseNumeric(latest['1. open']),
      high: parseNumeric(latest['2. high']),
      low: parseNumeric(latest['3. low']),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Fetch volume from Yahoo Finance (Alpha Vantage doesn't have reliable volume)
 */
async function fetchVolumeFromYahoo(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      next: { revalidate: 60 },
    });
    
    if (!response.ok) return 0;
    
    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;
    return meta?.regularMarketVolume || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Fetch stock detail data from Alpha Vantage OVERVIEW endpoint
 * Uses TIME_SERIES_DAILY for price/previousClose
 * Uses Yahoo Finance for volume
 * Logo fetching uses Finnhub (separate service)
 */
export async function fetchStockOverview(ticker: string): Promise<StockDetailData | null> {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey) {
    // If no API key, fallback to basic data
    const basicData = await fetchStockData(ticker);
    if (!basicData) return null;
    
    return {
      ticker: basicData.ticker,
      name: basicData.name,
      image: getStockLogoUrl(basicData.ticker, basicData.name),
      exchange: '',
      sector: '',
      industry: '',
      description: '',
      currency: 'USD',
      country: '',
      address: '',
      employees: null,
      fiscalYearEnd: null,
      latestQuarter: null,
      price: basicData.price,
      change: basicData.change,
      changePercent: basicData.change,
      previousClose: basicData.price - (basicData.changeAmount || 0),
      open: basicData.price,
      high: basicData.price,
      low: basicData.price,
      volume: 0,
      marketCap: null,
      peRatio: null,
      dividendYield: null,
      beta: null,
      eps: null,
      bookValue: null,
      pegRatio: null,
      priceToSales: null,
      priceToBook: null,
      evToRevenue: null,
      evToEbitda: null,
      profitMargin: null,
      operatingMargin: null,
      roa: null,
      roe: null,
      revenueGrowth: null,
      earningsGrowth: null,
      quarterlyRevenueGrowth: null,
      quarterlyEarningsGrowth: null,
      week52High: null,
      week52Low: null,
      day50MA: null,
      day200MA: null,
      sharesOutstanding: null,
      analystTargetPrice: null,
      dividendPerShare: null,
      dividendDate: null,
      exDividendDate: null,
    };
  }

  try {
    // Fetch OVERVIEW data from Alpha Vantage (for detailed metrics)
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
    const overviewResponse = await fetch(overviewUrl, { next: { revalidate: 86400 } });
    
    if (!overviewResponse.ok) {
      throw new Error(`HTTP error! status: ${overviewResponse.status}`);
    }
    
    const overviewData = await overviewResponse.json();
    
    // Check for API error messages
    if (overviewData['Error Message'] || overviewData['Note']) {
      // Rate limit or error - fallback to basic data
      const basicData = await fetchStockData(ticker);
      if (!basicData) return null;
      
      return {
        ticker: basicData.ticker,
        name: basicData.name,
        image: getStockLogoUrl(basicData.ticker, basicData.name),
        exchange: '',
        sector: '',
        industry: '',
        description: '',
        currency: 'USD',
        country: '',
        address: '',
        employees: null,
        fiscalYearEnd: null,
        latestQuarter: null,
        price: basicData.price,
        change: basicData.change,
        changePercent: basicData.change,
        previousClose: basicData.price - (basicData.changeAmount || 0),
        open: basicData.price,
        high: basicData.price,
        low: basicData.price,
        volume: 0,
        marketCap: null,
        peRatio: null,
        dividendYield: null,
        beta: null,
        eps: null,
        bookValue: null,
        pegRatio: null,
        priceToSales: null,
        priceToBook: null,
        evToRevenue: null,
        evToEbitda: null,
        profitMargin: null,
        operatingMargin: null,
        roa: null,
        roe: null,
        revenueGrowth: null,
        earningsGrowth: null,
        quarterlyRevenueGrowth: null,
        quarterlyEarningsGrowth: null,
        week52High: null,
        week52Low: null,
        day50MA: null,
        day200MA: null,
        sharesOutstanding: null,
        analystTargetPrice: null,
        dividendPerShare: null,
        dividendDate: null,
        exDividendDate: null,
      };
    }
    
    // Fetch price data from TIME_SERIES_DAILY (current and previous close)
    let priceData = await fetchPriceFromTimeSeries(ticker, apiKey);
    
    // Fallback to Yahoo Finance if TIME_SERIES fails
    if (!priceData || !priceData.price || !priceData.previousClose) {
      try {
        // Fetch 5 days of data to ensure we get previous close even if market is closed
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=1d&range=5d`;
        const yahooResponse = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          next: { revalidate: 60 },
        });
        
        if (yahooResponse.ok) {
          const yahooData = await yahooResponse.json();
          const result = yahooData.chart?.result?.[0];
          const meta = result?.meta;
          
          // Try to get price from various sources
          let price = meta?.regularMarketPrice || meta?.currentPrice || meta?.chartPreviousClose;
          let previousClose = meta?.previousClose || meta?.chartPreviousClose;
          
          // If we don't have previousClose from meta, try to get it from timestamps
          if (!previousClose && result?.timestamp && result?.indicators?.quote?.[0]?.close) {
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;
            
            // Get the most recent non-null close (current price)
            let latestPrice = null;
            let previousPrice = null;
            
            for (let i = closes.length - 1; i >= 0; i--) {
              if (closes[i] !== null && closes[i] !== undefined) {
                if (latestPrice === null) {
                  latestPrice = closes[i];
                } else if (previousPrice === null) {
                  previousPrice = closes[i];
                  break;
                }
              }
            }
            
            if (latestPrice && previousPrice) {
              price = latestPrice;
              previousClose = previousPrice;
            }
          }
          
          // Use price from meta if we found it
          if (price && previousClose && price > 0 && previousClose > 0) {
            priceData = {
              price: price,
              previousClose: previousClose,
              open: meta?.regularMarketOpen || meta?.open || price,
              high: meta?.regularMarketDayHigh || meta?.dayHigh || price,
              low: meta?.regularMarketDayLow || meta?.dayLow || price,
            };
          }
        }
      } catch (error) {
        console.error(`Yahoo Finance fallback failed for ${ticker}:`, error);
        // Continue with whatever we have
      }
    }
    
    // Fetch volume from Yahoo Finance
    const volume = await fetchVolumeFromYahoo(ticker);
    
    // Calculate price and change
    const price = priceData?.price || 0;
    const previousClose = priceData?.previousClose || null;
    
    // Calculate change and changePercent (same as watchlist modal)
    let change = 0;
    let changePercent = 0;
    if (price > 0 && previousClose !== null && previousClose > 0) {
      change = price - previousClose;
      changePercent = ((change / previousClose) * 100);
    }
    
    return {
      ticker: overviewData['Symbol'] || ticker.toUpperCase(),
      name: overviewData['Name'] || ticker,
      image: getStockLogoUrl(ticker, overviewData['Name']), // Uses Finnhub via proxy
      exchange: overviewData['Exchange'] || '',
      sector: overviewData['Sector'] || '',
      industry: overviewData['Industry'] || '',
      description: overviewData['Description'] || '',
      currency: overviewData['Currency'] || 'USD',
      country: overviewData['Country'] || '',
      address: overviewData['Address'] || '',
      employees: parseNumeric(overviewData['FullTimeEmployees']),
      fiscalYearEnd: parseDate(overviewData['FiscalYearEnd']),
      latestQuarter: parseDate(overviewData['LatestQuarter']),
      price: price,
      change: change,
      changePercent: changePercent,
      previousClose: previousClose ?? 0,
      open: priceData?.open ?? 0,
      high: priceData?.high ?? 0,
      low: priceData?.low ?? 0,
      volume: volume, // From Yahoo Finance
      marketCap: parseNumeric(overviewData['MarketCapitalization']),
      peRatio: parseNumeric(overviewData['PERatio']),
      dividendYield: parseNumeric(overviewData['DividendYield']),
      beta: parseNumeric(overviewData['Beta']),
      eps: parseNumeric(overviewData['EPS']),
      bookValue: parseNumeric(overviewData['BookValue']),
      pegRatio: parseNumeric(overviewData['PEGRatio']),
      priceToSales: parseNumeric(overviewData['PriceToSalesRatioTTM']),
      priceToBook: parseNumeric(overviewData['PriceToBookRatio']),
      evToRevenue: parseNumeric(overviewData['EVToRevenue']),
      evToEbitda: parseNumeric(overviewData['EVToEBITDA']),
      profitMargin: parseNumeric(overviewData['ProfitMargin']),
      operatingMargin: parseNumeric(overviewData['OperatingMarginTTM']),
      roa: parseNumeric(overviewData['ReturnOnAssetsTTM']),
      roe: parseNumeric(overviewData['ReturnOnEquityTTM']),
      revenueGrowth: parseNumeric(overviewData['QuarterlyRevenueGrowthYOY']),
      earningsGrowth: parseNumeric(overviewData['QuarterlyEarningsGrowthYOY']),
      quarterlyRevenueGrowth: parseNumeric(overviewData['QuarterlyRevenueGrowthYOY']),
      quarterlyEarningsGrowth: parseNumeric(overviewData['QuarterlyEarningsGrowthYOY']),
      week52High: parseNumeric(overviewData['52WeekHigh']),
      week52Low: parseNumeric(overviewData['52WeekLow']),
      day50MA: parseNumeric(overviewData['50DayMovingAverage']),
      day200MA: parseNumeric(overviewData['200DayMovingAverage']),
      sharesOutstanding: parseNumeric(overviewData['SharesOutstanding']),
      analystTargetPrice: parseNumeric(overviewData['AnalystTargetPrice']),
      dividendPerShare: parseNumeric(overviewData['DividendPerShare']),
      dividendDate: parseDate(overviewData['DividendDate']),
      exDividendDate: parseDate(overviewData['ExDividendDate']),
    };
  } catch (error) {
    // Fallback to basic data on error
    const basicData = await fetchStockData(ticker);
    if (!basicData) return null;
    
    return {
      ticker: basicData.ticker,
      name: basicData.name,
      image: getStockLogoUrl(basicData.ticker, basicData.name),
      exchange: '',
      sector: '',
      industry: '',
      description: '',
      currency: 'USD',
      country: '',
      address: '',
      employees: null,
      fiscalYearEnd: null,
      latestQuarter: null,
      price: basicData.price,
      change: basicData.change,
      changePercent: basicData.change,
      previousClose: basicData.price - (basicData.changeAmount || 0),
      open: basicData.price,
      high: basicData.price,
      low: basicData.price,
      volume: 0,
      marketCap: null,
      peRatio: null,
      dividendYield: null,
      beta: null,
      eps: null,
      bookValue: null,
      pegRatio: null,
      priceToSales: null,
      priceToBook: null,
      evToRevenue: null,
      evToEbitda: null,
      profitMargin: null,
      operatingMargin: null,
      roa: null,
      roe: null,
      revenueGrowth: null,
      earningsGrowth: null,
      quarterlyRevenueGrowth: null,
      quarterlyEarningsGrowth: null,
      week52High: null,
      week52Low: null,
      day50MA: null,
      day200MA: null,
      sharesOutstanding: null,
      analystTargetPrice: null,
      dividendPerShare: null,
      dividendDate: null,
      exDividendDate: null,
    };
  }
}

/**
 * Map common crypto tickers to CoinGecko coin IDs
 */
const TICKER_TO_COIN_ID: Record<string, string> = {
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

/**
 * Check if ticker is likely a stock (heuristic check)
 * Common stock patterns: 1-5 uppercase letters, often on major exchanges
 */
function isLikelyStock(ticker: string): boolean {
  const upperTicker = ticker.toUpperCase();
  
  // Common stock ticker patterns
  // Most stocks are 1-5 uppercase letters
  if (upperTicker.length > 5) {
    return false; // Crypto tickers are usually shorter
  }
  
  // Check if it matches common stock patterns
  // Stocks are typically all uppercase letters (no numbers in ticker)
  if (!/^[A-Z]+$/.test(upperTicker)) {
    return false; // If it has numbers, might be crypto
  }
  
  // Known crypto tickers should not be treated as stocks
  const knownCryptoTickers = Object.keys(TICKER_TO_COIN_ID);
  if (knownCryptoTickers.includes(upperTicker)) {
    return false; // This is a known crypto ticker
  }
  
  return true; // Likely a stock
}

/**
 * Get coin ID from ticker symbol
 * Only returns coin ID if we're confident it's crypto (not a stock)
 */
async function getCoinIdFromTicker(ticker: string): Promise<string | null> {
  const upperTicker = ticker.toUpperCase();
  
  // Check direct mapping first (known crypto tickers)
  if (TICKER_TO_COIN_ID[upperTicker]) {
    return TICKER_TO_COIN_ID[upperTicker];
  }
  
  // If it looks like a stock ticker and not in our known crypto list, don't search CoinGecko
  // This prevents false matches where CoinGecko might return something for a stock ticker
  if (isLikelyStock(ticker)) {
    return null; // Don't search CoinGecko for likely stock tickers
  }
  
  // Search CoinGecko for the ticker (only for tickers that don't look like stocks)
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker.toLowerCase())}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.coins || searchData.coins.length === 0) {
      return null;
    }
    
    // Find exact ticker match (case-insensitive)
    const exactMatch = searchData.coins.find((coin: any) => 
      coin.symbol.toLowerCase() === ticker.toLowerCase()
    );
    
    if (exactMatch) {
      return exactMatch.id;
    }
    
    // Don't return first result if no exact match - this prevents false positives
    // Only return if we have an exact symbol match
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch crypto detail data from CoinGecko
 * Only fetches if we're confident it's crypto (not a stock)
 */
export async function fetchCryptoDetail(ticker: string): Promise<CryptoDetailData | null> {
  try {
    const upperTicker = ticker.toUpperCase();
    
    // If it's likely a stock, don't even try crypto
    // This prevents false positives where CoinGecko might return something for a stock ticker
    if (isLikelyStock(ticker) && !TICKER_TO_COIN_ID[upperTicker]) {
      // Only check crypto if it's in our known crypto list
      // For unknown tickers that look like stocks, skip crypto check
      return null;
    }
    
    const coinId = await getCoinIdFromTicker(ticker);
    
    if (!coinId) {
      return null;
    }
    
    // Fetch comprehensive coin data
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !data.market_data) {
      return null;
    }
    
    const marketData = data.market_data;
    
    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      description: data.description?.en || '',
      image: data.image?.large || data.image?.small || '',
      links: {
        homepage: data.links?.homepage || [],
        whitepaper: data.links?.whitepaper || null,
        github: data.links?.repos_url?.github?.[0] || null,
        blockchainSite: data.links?.blockchain_site || [],
        officialForumUrl: data.links?.official_forum_url || [],
      },
      currentPrice: marketData.current_price?.usd || 0,
      priceChange24h: marketData.price_change_24h || 0,
      priceChangePercent24h: marketData.price_change_percentage_24h || 0,
      marketCap: marketData.market_cap?.usd || 0,
      marketCapRank: marketData.market_cap_rank || 0,
      fullyDilutedValuation: marketData.fully_diluted_valuation?.usd || null,
      totalVolume: marketData.total_volume?.usd || 0,
      high24h: marketData.high_24h?.usd || 0,
      low24h: marketData.low_24h?.usd || 0,
      circulatingSupply: marketData.circulating_supply || 0,
      totalSupply: marketData.total_supply || null,
      maxSupply: marketData.max_supply || null,
      ath: marketData.ath?.usd || 0,
      athDate: marketData.ath_date?.usd || '',
      atl: marketData.atl?.usd || 0,
      atlDate: marketData.atl_date?.usd || '',
      priceChangePercent5d: marketData.price_change_percentage_5d || 0,
      priceChangePercent30d: marketData.price_change_percentage_30d || 0,
      priceChangePercent1y: marketData.price_change_percentage_1y || null,
      marketCapChangePercent24h: marketData.market_cap_change_percentage_24h || 0,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Determine if ticker is stock or crypto
 * Tries crypto first, then stock
 */
export async function detectTickerType(ticker: string): Promise<TickerType> {
  // Try crypto first
  const cryptoData = await fetchCryptoData(ticker);
  if (cryptoData) {
    return 'crypto';
  }
  
  // Try stock
  const stockData = await fetchStockData(ticker);
  if (stockData) {
    return 'stock';
  }
  
  // Default to stock if neither works (will show error later)
  return 'stock';
}

/**
 * Fetch ticker detail data (auto-detects stock/crypto)
 * Prioritizes stocks for common stock ticker patterns to avoid false crypto matches
 */
export async function fetchTickerDetail(ticker: string): Promise<{
  type: TickerType;
  data: StockDetailData | CryptoDetailData;
} | null> {
  const upperTicker = ticker.toUpperCase();
  
  // If it's a known crypto ticker, try crypto first
  const isKnownCrypto = TICKER_TO_COIN_ID[upperTicker] !== undefined;
  
  if (isKnownCrypto) {
    // Known crypto - try crypto first
    const cryptoData = await fetchCryptoDetail(ticker);
    if (cryptoData) {
      return {
        type: 'crypto',
        data: cryptoData,
      };
    }
    // If known crypto fails, still try stock as fallback (in case of API issues)
  }
  
  // For likely stocks (common stock patterns), try stock first
  // This prevents false crypto matches from CoinGecko
  if (isLikelyStock(ticker)) {
    const stockData = await fetchStockOverview(ticker);
    if (stockData) {
      return {
        type: 'stock',
        data: stockData,
      };
    }
    
    // If stock failed and it's a known crypto, try crypto as fallback
    if (isKnownCrypto) {
      const cryptoData = await fetchCryptoDetail(ticker);
      if (cryptoData) {
        return {
          type: 'crypto',
          data: cryptoData,
        };
      }
    }
  } else {
    // Not a likely stock pattern - try crypto first, then stock
    const cryptoData = await fetchCryptoDetail(ticker);
    if (cryptoData) {
      return {
        type: 'crypto',
        data: cryptoData,
      };
    }
    
    // Fallback to stock
    const stockData = await fetchStockOverview(ticker);
    if (stockData) {
      return {
        type: 'stock',
        data: stockData,
      };
    }
  }
  
  return null;
}
