import { User } from './index';
import { StockData } from '@/utils/api/stockApi';

/** Recent search: backend is source of truth when logged in. Types: account (users) and ticker. */
export interface RecentSearch {
  id: string;
  query: string;
  type: 'account' | 'ticker';
  timestamp: string; // ISO
  resultId?: string; // username or ticker symbol
  resultName?: string;
  image?: string;
}

/**
 * News article from external news API
 */
export interface NewsArticle {
  id: string; // Unique identifier for the article
  title: string; // Article headline
  description: string; // Article summary/description
  url: string; // Link to full article
  imageUrl?: string; // Article thumbnail/image URL
  source: string; // News source name (e.g., "Reuters", "Bloomberg")
  publishedAt: string; // ISO timestamp of publication
  category: 'finance' | 'crypto' | 'politics' | 'business' | 'technology' | 'general'; // Article category
}

/**
 * Unified search result that can be either account, stock, or crypto
 */
export type SearchResult = 
  | { type: 'account'; data: User }
  | { type: 'stock'; data: StockData }
  | { type: 'crypto'; data: StockData };

/**
 * News category filter options
 * Note: API responses can include "general" so we support it here.
 */
export type NewsCategory =
  | 'all'
  | 'finance'
  | 'crypto'
  | 'politics'
  | 'business'
  | 'technology'
  | 'general';
