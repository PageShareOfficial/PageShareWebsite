import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API route to proxy article content
 * Fetches full article HTML and returns it for display in modal
 *
 * GET /api/news/article?url=<encoded_url>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleUrl = searchParams.get('url');

    if (!articleUrl) {
      return NextResponse.json(
        { error: 'Article URL is required' },
        { status: 400 }
      );
    }

    try {
      // Fetch the article URL
      const response = await fetch(decodeURIComponent(articleUrl), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Extract main content (simplified - in production you'd use a library like Readability)
      // For now, return the full HTML and let the client handle it
      return NextResponse.json(
        { 
          html,
          url: articleUrl,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    } catch (fetchError) {
      console.error('[API /api/news/article] Error fetching article:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch article content', details: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API /api/news/article] Error in article route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
