/**
 * Type definitions for ticker detail page
 * Supports both stocks (Alpha Vantage) and cryptocurrencies (CoinGecko)
 */

// Stock Detail Data (from Alpha Vantage OVERVIEW + GLOBAL_QUOTE)
export interface StockDetailData {
  // Basic Info (from OVERVIEW)
  ticker: string;
  name: string;
  image?: string; // Logo URL
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  currency: string;
  country: string;
  address: string;
  employees: number | null;
  fiscalYearEnd: string | null;
  latestQuarter: string | null;
  
  // Current Price (from GLOBAL_QUOTE)
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  
  // Key Metrics (from OVERVIEW)
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
  beta: number | null;
  eps: number | null;
  bookValue: number | null;
  
  // Valuation Metrics
  pegRatio: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  evToRevenue: number | null;
  evToEbitda: number | null;
  
  // Profitability Metrics
  profitMargin: number | null;
  operatingMargin: number | null;
  roa: number | null;
  roe: number | null;
  
  // Growth Metrics
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  quarterlyRevenueGrowth: number | null;
  quarterlyEarningsGrowth: number | null;
  
  // Price Stats
  week52High: number | null;
  week52Low: number | null;
  day50MA: number | null;
  day200MA: number | null;
  
  // Other
  sharesOutstanding: number | null;
  analystTargetPrice: number | null;
  
  // Dividend Info
  dividendPerShare: number | null;
  dividendDate: string | null;
  exDividendDate: string | null;
}

// Crypto Detail Data (from CoinGecko)
export interface CryptoDetailData {
  // Basic Info
  id: string;
  symbol: string;
  name: string;
  description: string;
  image: string;
  links: {
    homepage: string[];
    whitepaper: string | null;
    github: string | null;
    blockchainSite: string[];
    officialForumUrl: string[];
  };
  
  // Current Price
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  
  // Market Metrics
  marketCap: number;
  marketCapRank: number;
  fullyDilutedValuation: number | null;
  totalVolume: number;
  high24h: number;
  low24h: number;
  
  // Supply
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  
  // Price Stats
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  
  // Changes
  priceChangePercent5d: number;
  priceChangePercent30d: number;
  priceChangePercent1y: number | null;
  marketCapChangePercent24h: number;
}

// Union type for ticker detail
export type TickerDetailData = StockDetailData | CryptoDetailData;

// Chart Data
export interface ChartDataPoint {
  date: string; // ISO date string
  price: number;
  volume?: number;
  // For OHLC (if needed):
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface ChartData {
  timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all';
  data: ChartDataPoint[];
}

// Ticker Type
export type TickerType = 'stock' | 'crypto';

// API Response Types
export interface TickerDetailResponse {
  type: TickerType;
  data: TickerDetailData;
  lastUpdated: string;
}

export interface ChartDataResponse {
  timeRange: string;
  data: ChartDataPoint[];
}
