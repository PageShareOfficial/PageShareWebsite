"""
Ticker creation, lookup, and link to posts. Trending tickers from materialized view.
"""
from __future__ import annotations
from typing import List, Optional
from uuid import UUID
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.post_ticker import PostTicker
from app.models.ticker import Ticker

def get_or_create_ticker(db: Session, symbol: str) -> Ticker:
    """
    Get ticker by symbol (uppercase). Create if not exists.
    """
    symbol = symbol.strip().upper()
    ticker = db.query(Ticker).filter(Ticker.symbol == symbol).first()
    if ticker:
        return ticker
    ticker = Ticker(symbol=symbol)
    db.add(ticker)
    db.commit()
    db.refresh(ticker)
    return ticker

def link_post_tickers(db: Session, post_id: UUID, symbols: List[str]) -> None:
    """
    Link a post to tickers. Creates tickers if needed and inserts post_tickers.
    Deduplicates symbols and skips empty.
    """
    seen: set[str] = set()
    for sym in symbols:
        sym = sym.strip().upper()
        if not sym or sym in seen:
            continue
        seen.add(sym)
        ticker = get_or_create_ticker(db, sym)
        existing = (
            db.query(PostTicker)
            .filter(PostTicker.post_id == post_id, PostTicker.ticker_id == ticker.id)
            .first()
        )
        if not existing:
            db.add(PostTicker(post_id=post_id, ticker_id=ticker.id))
    db.commit()

def get_trending_tickers(
    db: Session,
    limit: int = 10,
) -> List[dict]:
    """
    Return trending tickers from materialized view trending_tickers.
    limit: max rows (default 10, API doc max 50).
    """
    if limit <= 0:
        return []
    limit = min(limit, 50)
    result = db.execute(
        text("""
            SELECT ticker_id, symbol, name, mention_count, mentions_24h, last_mentioned_at
            FROM trending_tickers
            ORDER BY mentions_24h DESC NULLS LAST, mention_count DESC NULLS LAST
            LIMIT :lim
        """),
        {"lim": limit},
    )
    rows = result.fetchall()
    return [
        {
            "ticker_id": str(r[0]),
            "symbol": r[1],
            "name": r[2],
            "mention_count": r[3] or 0,
            "mentions_24h": r[4] or 0,
            "last_mentioned_at": r[5],
        }
        for r in rows
    ]
