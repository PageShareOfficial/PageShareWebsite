import { User } from './index';
import { StockData } from '@/utils/api/stockApi';

/**
 * Recent search entry stored in localStorage
 * Tracks what user searched for and the result they selected
 */
export interface RecentSearch {
  id: string; // Unique ID for the search entry
  query: string; // Original search query
  type: 'account' | 'stock' | 'crypto'; // Type of search
  timestamp: string; // ISO timestamp when search was performed
  resultId?: string; // Username (for accounts) or ticker (for stocks/crypto)
  resultName?: string; // Display name (for accounts) or company name (for stocks/crypto)
  image?: string; // Avatar URL (for accounts) or logo URL (for stocks/crypto)
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

/**
 * Extended search suggestion that includes accounts
 * Extends the existing SearchSuggestion to include account results
 */
export interface UnifiedSearchSuggestion {
  type: 'account' | 'stock' | 'crypto';
  // For accounts
  user?: User;
  // For stocks/crypto (reuses existing SearchSuggestion)
  ticker?: string;
  name?: string;
}
