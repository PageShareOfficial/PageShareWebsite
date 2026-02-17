import { NextRequest, NextResponse } from 'next/server';
import { NewsCategory } from '@/types/discover';
import { fetchNews } from '@/utils/api/newsApi';

const SERVER_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours – GNews free tier ~100 requests/day
const SERVER_CACHE_MAX_ENTRIES = 30; // category × pages

interface CachedNews {
  articles: unknown[];
  totalArticles: number;
  timestamp: number;
}

const serverCache = new Map<string, CachedNews>();

function getCached(key: string): CachedNews | null {
  const entry = serverCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SERVER_CACHE_TTL_MS) {
    serverCache.delete(key);
    return null;
  }
  return entry;
}

function setCached(key: string, articles: unknown[], totalArticles: number): void {
  if (serverCache.size >= SERVER_CACHE_MAX_ENTRIES) {
    const firstKey = serverCache.keys().next().value;
    if (firstKey) serverCache.delete(firstKey);
  }
  serverCache.set(key, { articles, totalArticles, timestamp: Date.now() });
}

/**
 * API route to proxy news API requests (category only, no search).
 * Page 1: 20 articles, page 2+: 10 articles.
 * Cache: 4h in-memory (server) + Cache-Control (CDN/browser). Keeps GNews under ~100 requests/day.
 *
 * GET /api/news?category=finance&page=1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryParam = searchParams.get('category') || 'all';
    const pageParam = searchParams.get('page');

    const category: NewsCategory =
      ['all', 'finance', 'crypto', 'politics', 'business', 'technology'].includes(categoryParam)
        ? (categoryParam as NewsCategory)
        : 'all';

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = page === 1 ? 20 : 10;

    const cacheKey = `${category}_${page}`;
    const cached = getCached(cacheKey);
    let articles: unknown[];
    let totalArticles: number;

    if (cached) {
      articles = cached.articles;
      totalArticles = cached.totalArticles;
    } else {
      const newsResult = await fetchNews(category, page, pageSize);
      articles = newsResult.articles || [];
      totalArticles = newsResult.totalArticles || 0;
      if (articles.length > 0) {
        setCached(cacheKey, articles, totalArticles);
      }
    }

    return NextResponse.json(
      {
        articles,
        category,
        page,
        totalResults: articles.length,
        totalArticles,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=14400', // 4h
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { articles: [], error: 'Internal server error', totalArticles: 0 },
      { status: 500 }
    );
  }
}
