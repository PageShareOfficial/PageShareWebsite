"""
News endpoints: GET /news (category + pagination).
No search. Page 1: 20 articles, page 2+: 10 articles.
Cache: 45 min to stay under GNews 100 req/day limit.
Article content: fetched on frontend (Next.js route or iframe).
"""
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.schemas.news import NewsArticleResponse
from app.services.news_service import VALID_CATEGORIES, fetch_news

router = APIRouter(prefix="/news", tags=["news"])

# Cache: 45 min fresh, 45 min stale-while-revalidate (trading peaks: 9am, 12-2pm, 4pm)
CACHE_HEADERS = {
    "Cache-Control": "public, s-maxage=2700, stale-while-revalidate=2700",
}

@router.get("", response_model=dict)
def get_news(
    category: str = Query("all", description="Category: all, finance, crypto, politics, business, technology"),
    page: int = Query(1, ge=1, description="Page number"),
):
    """
    Get news articles by category. No search.
    Page 1: 20 articles, page 2+: 10 articles.
    """
    settings = get_settings()
    cat = category if category in VALID_CATEGORIES else "all"
    page_size = 20 if page == 1 else 10

    articles, total = fetch_news(
        api_key=settings.gnews_api_key,
        category=cat,
        page=page,
        page_size=page_size,
    )

    return JSONResponse(
        content={
            "articles": [NewsArticleResponse(**a).model_dump() for a in articles],
            "category": cat,
            "page": page,
            "totalResults": len(articles),
            "totalArticles": total,
        },
        headers=CACHE_HEADERS,
    )
