"""Investor saved analysts (bookmarks on prediction leaderboard)."""

from __future__ import annotations
from typing import List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.saved_analyst import SavedAnalyst
from app.models.user import User
from app.services.subscription_service import get_user_plan_id

class InvestorRequiredError(Exception):
    """Active investor subscription required."""

class AnalystTargetRequiredError(Exception):
    """Saved user must have an active analyst subscription."""

def is_investor_user(db: Session, user_id: UUID) -> bool:
    return get_user_plan_id(db, user_id) == "investor"

def assert_investor_user(db: Session, user_id: UUID) -> None:
    if not is_investor_user(db, user_id):
        raise InvestorRequiredError("Investor subscription required to save analysts.")

def assert_analyst_target(db: Session, analyst_id: UUID) -> None:
    if get_user_plan_id(db, analyst_id) != "analyst":
        raise AnalystTargetRequiredError("Only analyst subscribers can be saved.")

def add_saved_analyst(db: Session, investor_id: UUID, analyst_id: UUID) -> SavedAnalyst:
    """Save an analyst. Returns row. Raises ValueError if duplicate or self."""
    if investor_id == analyst_id:
        raise ValueError("Cannot save yourself")
    existing = (
        db.query(SavedAnalyst)
        .filter(
            SavedAnalyst.investor_id == investor_id,
            SavedAnalyst.analyst_id == analyst_id,
        )
        .first()
    )
    if existing:
        raise ValueError("Already saved")
    row = SavedAnalyst(investor_id=investor_id, analyst_id=analyst_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

def remove_saved_analyst(db: Session, investor_id: UUID, analyst_id: UUID) -> bool:
    row = (
        db.query(SavedAnalyst)
        .filter(
            SavedAnalyst.investor_id == investor_id,
            SavedAnalyst.analyst_id == analyst_id,
        )
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True

def is_analyst_saved(db: Session, investor_id: UUID, analyst_id: UUID) -> bool:
    return (
        db.query(SavedAnalyst)
        .filter(
            SavedAnalyst.investor_id == investor_id,
            SavedAnalyst.analyst_id == analyst_id,
        )
        .first()
        is not None
    )

def list_saved_analysts(
    db: Session,
    investor_id: UUID,
    *,
    page: int = 1,
    per_page: int = 50,
) -> Tuple[List[Tuple[User, SavedAnalyst]], int]:
    per_page = min(max(1, per_page), 100)
    offset = (page - 1) * per_page
    base = (
        db.query(User, SavedAnalyst)
        .join(SavedAnalyst, SavedAnalyst.analyst_id == User.id)
        .filter(SavedAnalyst.investor_id == investor_id)
    )
    total = base.count()
    rows = (
        base.order_by(SavedAnalyst.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    return rows, total
