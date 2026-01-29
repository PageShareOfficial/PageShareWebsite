"""
Unified search: users and tickers only (no posts). ILIKE on username/display_name, symbol/name.
"""
from __future__ import annotations
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.ticker import Ticker
from app.models.user import User

def search_users(
    db: Session,
    q: str,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[User], int]:
    """
    Search users by username or display_name (ILIKE). Exclude soft-deleted.
    Returns (list of User, total_count).
    """
    if not q or not q.strip():
        return [], 0
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page
    term = f"%{q.strip()}%"
    query = (
        db.query(User)
        .filter(User.deleted_at.is_(None))
        .filter(
            (User.username.ilike(term)) | (User.display_name.ilike(term))
        )
    )
    total = query.count()
    rows = query.order_by(User.username).offset(offset).limit(per_page).all()
    return rows, total

def search_tickers(
    db: Session,
    q: str,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[Tuple[str, Optional[str], Optional[str]]], int]:
    """
    Search tickers by symbol or name (ILIKE). Returns (list of (symbol, name, type), total_count).
    """
    if not q or not q.strip():
        return [], 0
    from sqlalchemy import or_
    per_page = min(max(1, per_page), 50)
    offset = (page - 1) * per_page
    term = f"%{q.strip()}%"
    query = db.query(Ticker).filter(
        or_(Ticker.symbol.ilike(term), Ticker.name.ilike(term))
    )
    total = query.count()
    rows = query.order_by(Ticker.symbol).offset(offset).limit(per_page).all()
    return [(r.symbol, r.name, r.type) for r in rows], total
