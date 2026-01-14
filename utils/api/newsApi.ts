import { NewsArticle, NewsCategory } from '@/types/discover';

/**
 * News API configuration
 * Supports multiple free news APIs as fallbacks
 * These can be accessed from both server and client side
 */
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || process.env.NEWS_API_KEY || '';
const GNEWS_API_KEY = process.env.NEXT_PUBLIC_GNEWS_API_KEY || process.env.GNEWS_API_KEY || '';

/**
 * Map our category to NewsAPI category
 */
function mapCategoryToNewsAPI(category: NewsCategory): string {
  switch (category) {
    case 'finance':
    case 'business':
      return 'business';
    case 'technology':
      return 'technology';
    case 'crypto':
      return 'technology'; // NewsAPI doesn't have crypto category
    case 'politics':
      return 'general'; // NewsAPI doesn't have politics category
    case 'all':
    default:
      return 'general';
  }
}

/**
 * Map our category to search query keywords
 */
function getSearchKeywords(category: NewsCategory): string[] {
  switch (category) {
    case 'finance':
      return ['finance', 'stock market', 'economy', 'trading', 'investing'];
    case 'business':
      return ['business', 'corporate', 'companies', 'enterprise', 'commerce', 'market'];
    case 'technology':
      return ['technology', 'tech', 'software', 'hardware', 'innovation', 'digital'];
    case 'crypto':
      return ['cryptocurrency', 'bitcoin', 'ethereum', 'crypto', 'blockchain'];
    case 'politics':
      return ['politics', 'election', 'government', 'policy'];
    case 'all':
    default:
      return [];
  }
}

/**
 * Generate unique ID for news article
 */
function generateArticleId(source: string, url: string): string {
  return `news-${source}-${url}`.replace(/[^a-zA-Z0-9-]/g, '-').substring(0, 100);
}

/**
 * Format date to ISO string
 * Note: This is different from formatDate in dateUtils (which formats for display)
 * This function normalizes dates to ISO format for storage/API consistency
 */
function formatDateToISO(dateString: string): string {
  try {
    return new Date(dateString).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Fetch news from NewsAPI.org
 * Free tier: 100 requests/day
 * Returns articles and totalArticles for pagination
 */
async function fetchFromNewsAPI(
  category: NewsCategory,
  page: number = 1,
  pageSize: number = 20
): Promise<{ articles: NewsArticle[]; totalArticles: number }> {
  if (!NEWS_API_KEY) {
    return { articles: [], totalArticles: 0 };
  }

  try {
    const apiCategory = mapCategoryToNewsAPI(category);
    const url = category === 'all'
      ? `https://newsapi.org/v2/top-headlines?country=us&page=${page}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`
      : `https://newsapi.org/v2/top-headlines?country=us&category=${apiCategory}&page=${page}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      // If it's a CORS error or network error, we need to use server-side proxy
      if (response.status === 0 || response.type === 'opaque') {
        // CORS error detected - must be called from server-side
      }
      
      return { articles: [], totalArticles: 0 };
    }

    const data = await response.json();
    
    // Check for NewsAPI error response
    if (data.errors || data.status === 'error') {
      return { articles: [], totalArticles: 0 };
    }
    
    if (!data.articles || !Array.isArray(data.articles)) {
      return { articles: [], totalArticles: 0 };
    }

    const articles = data.articles
      .filter((article: any) => article.title && article.url)
      .map((article: any) => {
        const keywords = getSearchKeywords(category);
        let matchedCategory: NewsArticle['category'] = 'general';
        
        if (keywords.some(kw => 
            (article.title?.toLowerCase().includes(kw) || 
             article.description?.toLowerCase().includes(kw))
          )) {
          // Map category based on requested category
          if (category === 'crypto') matchedCategory = 'crypto';
          else if (category === 'finance') matchedCategory = 'finance';
          else if (category === 'politics') matchedCategory = 'politics';
          else if (category === 'business') matchedCategory = 'business';
          else if (category === 'technology') matchedCategory = 'technology';
        } else if (category !== 'all') {
          // If specific category requested and NewsAPI supports it, use it
          if (category === 'business' || category === 'technology') {
            matchedCategory = category as NewsArticle['category'];
          }
        }

        return {
          id: generateArticleId(article.source?.name || 'unknown', article.url),
          title: article.title,
          description: article.description || '',
          url: article.url,
          imageUrl: article.urlToImage || undefined,
          source: article.source?.name || 'Unknown',
          publishedAt: formatDateToISO(article.publishedAt || new Date().toISOString()),
          category: matchedCategory,
        };
      });
    
    // NewsAPI returns totalResults
    return {
      articles,
      totalArticles: data.totalResults || 0,
    };
  } catch (error) {
    return { articles: [], totalArticles: 0 };
  }
}

/**
 * Fetch news from GNews API
 * Free tier: 100 requests/day
 * Returns articles and totalArticles count for pagination
 */
async function fetchFromGNews(
  category: NewsCategory,
  page: number = 1,
  pageSize: number = 20
): Promise<{ articles: NewsArticle[]; totalArticles: number }> {
  if (!GNEWS_API_KEY) {
    return { articles: [], totalArticles: 0 };
  }

  try {
    const keywords = getSearchKeywords(category);
    const query = category === 'all' 
      ? 'finance OR crypto OR politics OR stock market'
      : keywords.join(' OR ');

    // Add country=us for US-only articles
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&page=${page}&max=${pageSize}&apikey=${GNEWS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      return { articles: [], totalArticles: 0 };
    }

    const data = await response.json();
    
    if (!data.articles || !Array.isArray(data.articles)) {
      return { articles: [], totalArticles: 0 };
    }

    const articles = data.articles
      .filter((article: any) => article.title && article.url)
      .map((article: any): NewsArticle => {
        const titleLower = article.title?.toLowerCase() || '';
        const descLower = article.description?.toLowerCase() || '';
        const combined = titleLower + ' ' + descLower;
        
        let matchedCategory: NewsArticle['category'] = 'general';
        
        if (combined.includes('crypto') || combined.includes('bitcoin') || combined.includes('ethereum') || combined.includes('blockchain')) {
          matchedCategory = 'crypto';
        } else if (combined.includes('finance') || combined.includes('stock') || combined.includes('market') || combined.includes('trading')) {
          matchedCategory = 'finance';
        } else if (combined.includes('business') || combined.includes('corporate') || combined.includes('company') || combined.includes('enterprise')) {
          matchedCategory = 'business';
        } else if (combined.includes('technology') || combined.includes('tech') || combined.includes('software') || combined.includes('digital') || combined.includes('ai') || combined.includes('artificial intelligence')) {
          matchedCategory = 'technology';
        } else if (combined.includes('politics') || combined.includes('election') || combined.includes('government') || combined.includes('policy')) {
          matchedCategory = 'politics';
        }
        
        // Override with requested category if it matches better
        if (category !== 'all') {
          if ((category === 'business' && (combined.includes('business') || combined.includes('corporate'))) ||
              (category === 'technology' && (combined.includes('technology') || combined.includes('tech'))) ||
              (category === 'finance' && (combined.includes('finance') || combined.includes('stock'))) ||
              (category === 'crypto' && (combined.includes('crypto') || combined.includes('bitcoin'))) ||
              (category === 'politics' && (combined.includes('politics') || combined.includes('election')))) {
            matchedCategory = category as NewsArticle['category'];
          } else if (category === 'business' || category === 'technology') {
            // If specifically requesting business or tech, use that category
            matchedCategory = category as NewsArticle['category'];
          }
        }

        // Ensure matchedCategory is valid
        const finalCategory: NewsArticle['category'] = 
          (matchedCategory === 'business' || matchedCategory === 'technology') 
            ? matchedCategory 
            : matchedCategory === 'crypto' || matchedCategory === 'finance' || matchedCategory === 'politics'
            ? matchedCategory
            : 'general';

        return {
          id: generateArticleId(article.source?.name || 'unknown', article.url),
          title: article.title,
          description: article.description || '',
          url: article.url,
          imageUrl: article.image || undefined,
          source: article.source?.name || 'Unknown',
          publishedAt: formatDateToISO(article.publishedAt || new Date().toISOString()),
          category: finalCategory,
        };
      });

    return {
      articles,
      totalArticles: data.totalArticles || 0,
    };
  } catch (error) {
    return { articles: [], totalArticles: 0 };
  }
}

/**
 * Fetch news articles
 * Tries multiple APIs with fallback
 * Returns articles and totalArticles for pagination
 */
export async function fetchNews(
  category: NewsCategory = 'all',
  page: number = 1,
  pageSize: number = 20
): Promise<{ articles: NewsArticle[]; totalArticles: number }> {
  // Try GNews first (since user has GNews key)
  if (GNEWS_API_KEY) {
    try {
      const gnewsResults = await fetchFromGNews(category, page, pageSize);
      if (gnewsResults.articles.length > 0) {
        return gnewsResults;
      }
    } catch (error) {
      // Fall through to NewsAPI
    }
  }

  // Fallback to NewsAPI
  if (NEWS_API_KEY) {
    try {
      const newsApiResults = await fetchFromNewsAPI(category, page, pageSize);
      if (newsApiResults.articles.length > 0) {
        return newsApiResults;
      }
    } catch (error) {
      // Fall through to empty result
    }
  }

  // If no API keys or both fail, return empty
  return { articles: [], totalArticles: 0 };
}

/**
 * Search news by query
 * Returns articles and totalArticles for pagination
 */
export async function fetchNewsByQuery(query: string, page: number = 1, pageSize: number = 20): Promise<{ articles: NewsArticle[]; totalArticles: number }> {
  if (!query.trim()) {
    return fetchNews('all', page, pageSize);
  }

  // Try GNews search (better for keyword search)
  if (GNEWS_API_KEY) {
    try {
      // Add country=us for US-only articles
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&page=${page}&max=${pageSize}&apikey=${GNEWS_API_KEY}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.articles && Array.isArray(data.articles)) {
          const articles = data.articles
            .filter((article: any) => article.title && article.url)
            .map((article: any): NewsArticle => ({
              id: generateArticleId(article.source?.name || 'unknown', article.url),
              title: article.title,
              description: article.description || '',
              url: article.url,
              imageUrl: article.image || undefined,
              source: article.source?.name || 'Unknown',
              publishedAt: formatDateToISO(article.publishedAt || new Date().toISOString()),
              category: 'general', // Will be categorized by content
            }));
          return {
            articles,
            totalArticles: data.totalArticles || 0,
          };
        }
      }
    } catch (error) {
      // Fall through to NewsAPI
    }
  }

  // Fallback: Use NewsAPI search endpoint
  if (NEWS_API_KEY) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&page=${page}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.articles && Array.isArray(data.articles)) {
          const articles = data.articles
            .filter((article: any) => article.title && article.url)
            .map((article: any): NewsArticle => ({
              id: generateArticleId(article.source?.name || 'unknown', article.url),
              title: article.title,
              description: article.description || '',
              url: article.url,
              imageUrl: article.urlToImage || undefined,
              source: article.source?.name || 'Unknown',
              publishedAt: formatDateToISO(article.publishedAt || new Date().toISOString()),
              category: 'general',
            }));
          return {
            articles,
            totalArticles: data.totalResults || 0,
          };
        }
      }
    } catch (error) {
      // Fall through to empty result
    }
  }

  return { articles: [], totalArticles: 0 };
}
