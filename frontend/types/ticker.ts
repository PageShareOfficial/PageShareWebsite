/**
 * Type definitions for ticker detail page – crypto only (CoinGecko).
 */

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

export type TickerDetailData = CryptoDetailData;

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

export type TickerType = 'crypto';

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
