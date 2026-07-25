"""Public prediction leaderboard (30d Net RR ranking)."""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import case, func
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.models.user import User
from app.services.prediction_analytics_service import (
    _analyst_user_ids,
    _prediction_setup_rr,
    _win_rate_percent,
)
from app.services.prediction_constants import (
    ANALYTICS_LOOKBACK_DAYS,
    OUTCOME_LOSS,
    OUTCOME_WIN,
    PREDICTION_STATUS_INVALID,
    RESOLVED_OUTCOMES,
)
from app.services.prediction_rr_utils import net_rr_contribution
from app.services.subscription_service import get_active_plan_ids_for_users

DEFAULT_LEADERBOARD_PER_PAGE = 20
MAX_LEADERBOARD_PER_PAGE = 50

@dataclass(frozen=True)
class LeaderboardEntryRow:
    user_id: UUID
    rank: int
    net_rr_30d: float
    win_rate_percent: Optional[float]
    predictions_count: int
    wins: int

def _lifetime_stats_by_analyst(
    db: Session, analyst_ids: set[UUID]
) -> dict[UUID, tuple[int, int, int]]:
    """Return user_id -> (total_predictions, wins, losses)."""
    if not analyst_ids:
        return {}

    win_case = case((Prediction.outcome == OUTCOME_WIN, 1), else_=0)
    loss_case = case((Prediction.outcome == OUTCOME_LOSS, 1), else_=0)
    rows = (
        db.query(
            Prediction.user_id,
            func.count(Prediction.id),
            func.coalesce(func.sum(win_case), 0),
            func.coalesce(func.sum(loss_case), 0),
        )
        .filter(
            Prediction.user_id.in_(analyst_ids),
            Prediction.status != PREDICTION_STATUS_INVALID,
        )
        .group_by(Prediction.user_id)
        .all()
    )
    return {
        user_id: (int(total), int(wins), int(losses))
        for user_id, total, wins, losses in rows
    }

def _net_rr_30d_by_analyst(
    db: Session,
    analyst_ids: set[UUID],
    *,
    now: datetime,
) -> dict[UUID, float]:
    since = now - timedelta(days=ANALYTICS_LOOKBACK_DAYS)
    net_by_user: dict[UUID, float] = {uid: 0.0 for uid in analyst_ids}
    rows = (
        db.query(Prediction)
        .filter(
            Prediction.user_id.in_(analyst_ids),
            Prediction.resolved_at.isnot(None),
            Prediction.resolved_at >= since,
            Prediction.outcome.in_(tuple(RESOLVED_OUTCOMES)),
            Prediction.status != PREDICTION_STATUS_INVALID,
        )
        .all()
    )
    for row in rows:
        setup_rr = _prediction_setup_rr(row)
        net_by_user[row.user_id] += net_rr_contribution(row.outcome, setup_rr)
    return {uid: round(net, 2) for uid, net in net_by_user.items()}

def list_prediction_leaderboard(
    db: Session,
    *,
    page: int = 1,
    per_page: int = DEFAULT_LEADERBOARD_PER_PAGE,
    now: Optional[datetime] = None,
) -> tuple[list[LeaderboardEntryRow], int]:
    """Rank active analyst subscribers by 30-day Net RR (paginated)."""
    now = now or datetime.now(timezone.utc)
    safe_page = max(1, page)
    safe_per_page = max(1, min(per_page, MAX_LEADERBOARD_PER_PAGE))
    analyst_ids = _analyst_user_ids(db)
    if not analyst_ids:
        return [], 0

    lifetime_map = _lifetime_stats_by_analyst(db, analyst_ids)
    net_map = _net_rr_30d_by_analyst(db, analyst_ids, now=now)

    ranked = sorted(
        analyst_ids,
        key=lambda uid: (-net_map.get(uid, 0.0), str(uid)),
    )
    total = len(ranked)
    offset = (safe_page - 1) * safe_per_page
    page_ids = ranked[offset : offset + safe_per_page]

    entries: list[LeaderboardEntryRow] = []
    for index, user_id in enumerate(page_ids, start=offset + 1):
        total_preds, wins, losses = lifetime_map.get(user_id, (0, 0, 0))
        entries.append(
            LeaderboardEntryRow(
                user_id=user_id,
                rank=index,
                net_rr_30d=net_map.get(user_id, 0.0),
                win_rate_percent=_win_rate_percent(wins, losses),
                predictions_count=total_preds,
                wins=wins,
            )
        )
    return entries, total

def load_leaderboard_users(
    db: Session, entries: list[LeaderboardEntryRow]
) -> dict[UUID, User]:
    if not entries:
        return {}
    user_ids = [entry.user_id for entry in entries]
    rows = db.query(User).filter(User.id.in_(user_ids)).all()
    return {user.id: user for user in rows}

def plan_ids_for_leaderboard(
    db: Session, entries: list[LeaderboardEntryRow]
) -> dict[UUID, str | None]:
    if not entries:
        return {}
    return get_active_plan_ids_for_users(
        db, [entry.user_id for entry in entries]
    )
