import { Post, WatchlistItem, Narrative } from '@/types';

export const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      id: 'u1',
      displayName: 'Sarah Chen',
      handle: 'sarahchen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      badge: 'Verified',
    },
    createdAt: '2h',
    assets: ['AAPL', 'NVDA'],
    horizon: '90D',
    type: 'Thesis',
    status: 'Open',
    priceChange: 3.1,
    confidence: 72,
    sparkline: [0, 1.2, 0.8, 2.1, 1.9, 2.8, 3.1],
    thesis: 'Apple\'s services revenue growth combined with NVDA\'s data center expansion creates a strong 90-day momentum play. Both stocks are undervalued relative to forward earnings multiples.',
    catalysts: ['WWDC announcements', 'Q2 earnings beat', 'Data center AI demand'],
    risks: ['Regulatory concerns', 'Market volatility', 'Supply chain'],
    linkedNews: {
      title: 'Apple announces new AI features at WWDC',
      url: '#',
    },
    stats: {
      likes: 124,
      comments: 23,
      reposts: 8,
      bookmarks: 45,
    },
    userInteractions: {
      liked: false,
      bookmarked: false,
      reposted: false,
    },
  },
  {
    id: '2',
    author: {
      id: 'u2',
      displayName: 'Michael Torres',
      handle: 'mtorres',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
      badge: 'Public',
    },
    createdAt: '5h',
    assets: ['BTC', 'ETH'],
    horizon: '14D',
    type: 'Macro',
    status: 'Thesis held',
    priceChange: -1.2,
    confidence: 65,
    sparkline: [0, -0.5, -0.8, -1.0, -1.1, -1.2],
    thesis: 'Short-term bearish on crypto as institutional flows slow. Expecting consolidation around current levels before next leg up.',
    catalysts: ['ETF inflows resume', 'Rate cuts'],
    risks: ['Regulatory uncertainty', 'Liquidity crunch'],
    stats: {
      likes: 89,
      comments: 12,
      reposts: 5,
      bookmarks: 31,
    },
    userInteractions: {
      liked: true,
      bookmarked: false,
      reposted: false,
    },
  },
  {
    id: '3',
    author: {
      id: 'u3',
      displayName: 'Emma Wilson',
      handle: 'emw',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
      badge: 'Verified',
    },
    createdAt: '1d',
    assets: ['SPY'],
    horizon: '1Y',
    type: 'ETF',
    status: 'Closed',
    priceChange: 8.3,
    confidence: 85,
    sparkline: [0, 2.1, 3.5, 5.2, 6.8, 7.5, 8.3],
    thesis: 'SPY is the ultimate hedge for long-term growth. Diversified exposure with low fees makes it the foundation of any portfolio.',
    catalysts: ['Market recovery', 'Tech sector strength'],
    risks: ['Recession risk', 'Geopolitical events'],
    stats: {
      likes: 256,
      comments: 67,
      reposts: 34,
      bookmarks: 128,
    },
    userInteractions: {
      liked: true,
      bookmarked: true,
      reposted: false,
    },
  },
];

export const mockWatchlist: WatchlistItem[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', change: 2.3, price: 189.45 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', change: 5.7, price: 892.30 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', change: 1.8, price: 428.90 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', change: -0.5, price: 142.20 },
  { ticker: 'TSLA', name: 'Tesla Inc.', change: 3.2, price: 245.60 },
];

export const mockNarratives: Narrative[] = [
  {
    id: 'n1',
    title: 'AI Capex cycle',
    score: 78,
    relatedTickers: ['NVDA', 'AMD', 'MSFT', 'GOOGL'],
    progress: 65,
  },
  {
    id: 'n2',
    title: 'Energy transition',
    score: 62,
    relatedTickers: ['TSLA', 'ENPH', 'PLUG'],
    progress: 42,
  },
  {
    id: 'n3',
    title: 'Healthcare innovation',
    score: 55,
    relatedTickers: ['MRNA', 'PFE', 'JNJ'],
    progress: 38,
  },
];

