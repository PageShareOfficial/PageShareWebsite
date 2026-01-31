"""
Add/remove tickers from user watchlist. List user's watchlist.
"""
from __future__ import annotations
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.watchlist_item import WatchlistItem
from app.services.ticker_service import get_or_create_ticker

def add_to_watchlist(db: Session, user_id: UUID, symbol: str) -> bool:
    """
    Add ticker to user's watchlist. Creates ticker if not exists.
    Returns True if added. Raises ValueError if already in watchlist.
    """
    ticker = get_or_create_ticker(db, symbol)
    existing = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user_id, WatchlistItem.ticker_id == ticker.id)
        .first()
    )
    if existing:
        raise ValueError("Already in watchlist")
    db.add(WatchlistItem(user_id=user_id, ticker_id=ticker.id))
    db.commit()
    return True

def remove_from_watchlist(db: Session, user_id: UUID, symbol: str) -> bool:
    """
    Remove ticker from user's watchlist by symbol.
    Returns True if removed, False if not found.
    """
    from app.models.ticker import Ticker

    symbol = symbol.strip().upper()
    row = (
        db.query(WatchlistItem)
        .join(Ticker, WatchlistItem.ticker_id == Ticker.id)
        .filter(WatchlistItem.user_id == user_id, Ticker.symbol == symbol)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def list_watchlist(db: Session, user_id: UUID) -> List[dict]:
    """
    List user's watchlist items with ticker info.
    Returns list of {ticker, name, type, created_at}.
    """
    from app.models.ticker import Ticker

    rows = (
        db.query(WatchlistItem, Ticker)
        .join(Ticker, WatchlistItem.ticker_id == Ticker.id)
        .filter(WatchlistItem.user_id == user_id)
        .order_by(WatchlistItem.created_at.desc())
        .all()
    )
    return [
        {
            "ticker": t.symbol,
            "name": t.name,
            "type": t.type,
            "created_at": wi.created_at,
        }
        for wi, t in rows
    ]
