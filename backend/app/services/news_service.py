"""
Fetch news from GNews API. Category-based only (no search).
Page 1: 20 articles, page 2+: 10 articles.
"""
from __future__ import annotations
from typing import Any, List

VALID_CATEGORIES: tuple[str, ...] = (
    "all", "finance", "crypto", "politics", "business", "technology"
)

def _get_search_keywords(category: str) -> List[str]:
    """Map category to GNews search keywords."""
    keywords = {
        "finance": ["finance", "stock market", "economy", "trading", "investing"],
        "business": ["business", "corporate", "companies", "enterprise", "commerce", "market"],
        "technology": ["technology", "tech", "software", "hardware", "innovation", "digital"],
        "crypto": ["cryptocurrency", "bitcoin", "ethereum", "crypto", "blockchain"],
        "politics": ["politics", "election", "government", "policy"],
    }
    return keywords.get(category, [])

def _generate_article_id(source: str, url: str) -> str:
    """Generate unique ID for article."""
    return f"news-{source}-{url}".replace(" ", "-")[:100]

def _format_date_iso(date_str: str) -> str:
    """Normalize date to ISO format."""
    if not date_str or not date_str.strip():
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    try:
        from datetime import datetime
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).isoformat()
    except Exception:
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()

def _map_article_category(title: str, description: str, requested: str) -> str:
    """Infer article category from content."""
    combined = (title or "").lower() + " " + (description or "").lower()
    if any(k in combined for k in ["crypto", "bitcoin", "ethereum", "blockchain"]):
        return "crypto"
    if any(k in combined for k in ["finance", "stock", "market", "trading"]):
        return "finance"
    if any(k in combined for k in ["business", "corporate", "company", "enterprise"]):
        return "business"
    if any(k in combined for k in ["technology", "tech", "software", "digital", "ai"]):
        return "technology"
    if any(k in combined for k in ["politics", "election", "government", "policy"]):
        return "politics"
    if requested in VALID_CATEGORIES and requested != "all":
        return requested
    return "general"

def fetch_news(
    api_key: str,
    category: str = "all",
    page: int = 1,
    page_size: int | None = None,
) -> tuple[List[dict[str, Any]], int]:
    """
    Fetch news from GNews API.
    Returns (articles, total_articles).
    Page 1: 20 articles, page 2+: 10 articles.
    """
    if not api_key:
        return [], 0

    if page_size is None:
        page_size = 20 if page == 1 else 10

    keywords = _get_search_keywords(category)
    query = (
        "finance OR crypto OR politics OR stock market"
        if category == "all"
        else " OR ".join(keywords)
    )

    import json
    import urllib.parse
    import urllib.request

    url = (
        f"https://gnews.io/api/v4/search?q={urllib.parse.quote(query)}"
        f"&lang=en&country=us&page={page}&max={page_size}&apikey={api_key}"
    )

    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        return [], 0

    if not data.get("articles") or not isinstance(data["articles"], list):
        return [], 0

    articles = []
    for a in data["articles"]:
        if not a.get("title") or not a.get("url"):
            continue
        title = a["title"]
        desc = a.get("description") or ""
        cat = _map_article_category(title, desc, category)
        articles.append({
            "id": _generate_article_id(a.get("source", {}).get("name", "unknown"), a["url"]),
            "title": title,
            "description": desc,
            "url": a["url"],
            "imageUrl": a.get("image"),
            "source": a.get("source", {}).get("name", "Unknown"),
            "publishedAt": _format_date_iso(a.get("publishedAt", "")),
            "category": cat,
        })

    total = data.get("totalArticles", 0) or 0
    return articles, total