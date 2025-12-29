export type PostType = 'Thesis' | 'Macro' | 'Quant' | 'ETF' | 'Habit';
export type PostStatus = 'Open' | 'Thesis held' | 'Closed';
export type FeedTab = 'For you' | 'Following' | 'Outcomes';
export type Horizon = '14D' | '90D' | '1Y';

export interface User {
  id: string;
  displayName: string;
  handle: string;
  avatar: string;
  badge?: 'Verified' | 'Public';
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  assets: string[]; // e.g., ['AAPL', 'BTC']
  horizon: Horizon;
  type: PostType;
  status: PostStatus;
  priceChange: number; // percentage since posted
  confidence: number; // 0-100
  sparkline: number[]; // array of values for sparkline
  thesis: string;
  catalysts: string[];
  risks: string[];
  linkedNews?: {
    title: string;
    url: string;
  };
  stats: {
    likes: number;
    comments: number;
    reposts: number;
    bookmarks: number;
  };
  userInteractions: {
    liked: boolean;
    bookmarked: boolean;
    reposted: boolean;
  };
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  change: number; // percentage
  price: number;
}

export interface Narrative {
  id: string;
  title: string;
  score: number; // 0-100
  relatedTickers: string[];
  progress: number; // 0-100
}

