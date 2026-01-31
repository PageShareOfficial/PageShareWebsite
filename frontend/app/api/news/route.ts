import { NextRequest, NextResponse } from 'next/server';
import { NewsCategory } from '@/types/discover';
import { fetchNews } from '@/utils/api/newsApi';

/**
 * API route to proxy news API requests (category only, no search).
 * Page 1: 20 articles, page 2+: 10 articles.
 * Cache: 45 min (trading peaks: 9am, 12-2pm, 4pm).
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

    const newsResult = await fetchNews(category, page, pageSize);
    const articles = newsResult.articles || [];
    const totalArticles = newsResult.totalArticles || 0;

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
          'Cache-Control': 'public, s-maxage=2700, stale-while-revalidate=2700', // 45 min
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
