import { NextRequest, NextResponse } from 'next/server';
import { NewsCategory } from '@/types/discover';
import { fetchNews, fetchNewsByQuery } from '@/utils/api/newsApi';

/**
 * API route to proxy news API requests
 * Handles categories: finance, crypto, politics, all
 * Caches responses for 5 minutes
 * 
 * GET /api/news?category=finance&page=1
 * GET /api/news?q=bitcoin
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryParam = searchParams.get('category') || 'all';
    const pageParam = searchParams.get('page');
    const queryParam = searchParams.get('q');

    // Validate category
    const category: NewsCategory = 
      ['all', 'finance', 'crypto', 'politics', 'business', 'technology'].includes(categoryParam)
        ? (categoryParam as NewsCategory)
        : 'all';

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    // First page: 5 articles, subsequent pages: 20 articles
    const pageSize = page === 1 ? 5 : 20;

    let articles = [];
    let totalArticles = 0;

    // If query provided, search news
    if (queryParam) {
      const searchResult = await fetchNewsByQuery(queryParam, page, pageSize);
      articles = searchResult.articles || [];
      totalArticles = searchResult.totalArticles || 0;
    } else {
      // Fetch category-based news
      const newsResult = await fetchNews(category, page, pageSize);
      articles = newsResult.articles || [];
      totalArticles = newsResult.totalArticles || 0;
    }

    return NextResponse.json(
      {
        articles,
        category: queryParam ? undefined : category,
        page,
        totalResults: articles.length,
        totalArticles, // Total articles available from API
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800', // Cache for 15 min, stale for 30 min
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
