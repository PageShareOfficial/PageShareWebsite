"""Prediction analytics dashboard with plan-based access rules."""

from __future__ import annotations
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.models.user import User
from app.models.user_entitlement import UserEntitlement
from app.services.prediction_rr_utils import net_rr_contribution, setup_risk_reward
from app.services.prediction_service import AnalystRequiredError, is_analyst_user
from app.services.saved_analyst_service import (
    AnalystTargetRequiredError,
    InvestorRequiredError,
    assert_analyst_target,
    assert_investor_user,
)
from app.services.subscription_service import row_grants_premium
from app.services.user_service import get_user_by_username
from app.services.billing_constants import PLAN_ID_ANALYST
from app.services.prediction_constants import (
    ANALYTICS_LOOKBACK_DAYS,
    ANALYTICS_TOP_ASSETS_LIMIT,
    OUTCOME_LOSS,
    OUTCOME_WIN,
    PREDICTION_STATUS_ACTIVE,
    PREDICTION_STATUS_INVALID,
    POSITION_LONG,
    RESOLVED_OUTCOMES,
    RESOLVED_STATUSES,
)


@dataclass(frozen=True)
class NetRrSeriesPoint:
    resolved_at: datetime
    cumulative_net_rr: float


@dataclass(frozen=True)
class AnalyticsPeriodStats:
    net_rr: float
    win_rate_percent: Optional[float]
    resolved_count: int
    wins: int
    losses: int
    expired: int


@dataclass(frozen=True)
class AnalyticsLifetimeStats:
    total_predictions: int
    active_count: int
    resolved_count: int
    wins: int
    losses: int
    expired: int
    win_rate_percent: Optional[float]
    average_return_percent: Optional[float]


@dataclass(frozen=True)
class AssetCount:
    asset: str
    count: int


@dataclass(frozen=True)
class AnalyticsTradingStyle:
    long_count: int
    short_count: int
    long_percent: Optional[float]
    short_percent: Optional[float]
    top_assets: tuple[AssetCount, ...]
    average_confidence: Optional[float]
    average_setup_rr: Optional[float]


@dataclass(frozen=True)
class PredictionAnalyticsDashboard:
    rank: Optional[int]
    rank_total: int
    net_rr_30d: float
    recent_30d: AnalyticsPeriodStats
    net_rr_series_30d: tuple[NetRrSeriesPoint, ...]
    lifetime: AnalyticsLifetimeStats
    style: AnalyticsTradingStyle


def _is_resolved(prediction: Prediction) -> bool:
    return (
        prediction.outcome in RESOLVED_OUTCOMES
        and prediction.status in RESOLVED_STATUSES
    )


def _prediction_setup_rr(prediction: Prediction) -> float:
    return setup_risk_reward(
        float(prediction.entry_price),
        float(prediction.target_price),
        float(prediction.stop_loss),
    )


def _win_rate_percent(wins: int, losses: int) -> Optional[float]:
    decided = wins + losses
    if decided <= 0:
        return None
    return round(100.0 * wins / decided, 1)


def _analyst_user_ids(db: Session) -> set[UUID]:
    rows = (
        db.query(UserEntitlement)
        .filter(UserEntitlement.plan_id == PLAN_ID_ANALYST)
        .all()
    )
    return {
        row.user_id for row in rows if row_grants_premium(row)
    }


def compute_leaderboard_rank(
    db: Session, analyst_id: UUID, *, now: Optional[datetime] = None
) -> tuple[Optional[int], int, float]:
    """Return (rank by Net RR 30d, analyst cohort size, subject Net RR 30d)."""
    now = now or datetime.now(timezone.utc)
    since = now - timedelta(days=ANALYTICS_LOOKBACK_DAYS)
    analyst_ids = _analyst_user_ids(db)
    rank_total = len(analyst_ids)
    if rank_total == 0:
        return None, 0, 0.0

    rows = (
        db.query(Prediction)
        .filter(
            Prediction.resolved_at.isnot(None),
            Prediction.resolved_at >= since,
            Prediction.outcome.in_(tuple(RESOLVED_OUTCOMES)),
            Prediction.status != PREDICTION_STATUS_INVALID,
        )
        .all()
    )

    net_by_user: dict[UUID, float] = {uid: 0.0 for uid in analyst_ids}
    for row in rows:
        if row.user_id not in net_by_user:
            continue
        net_by_user[row.user_id] += net_rr_contribution(
            row.outcome, _prediction_setup_rr(row)
        )

    subject_net = round(net_by_user.get(analyst_id, 0.0), 2)
    ranked = sorted(
        ((uid, round(net, 2)) for uid, net in net_by_user.items()),
        key=lambda item: item[1],
        reverse=True,
    )
    rank_map = {uid: index + 1 for index, (uid, _) in enumerate(ranked)}
    subject_rank = rank_map.get(analyst_id)
    return subject_rank, rank_total, subject_net


def build_analytics_dashboard(
    db: Session, analyst_id: UUID, *, now: Optional[datetime] = None
) -> PredictionAnalyticsDashboard:
    now = now or datetime.now(timezone.utc)
    since = now - timedelta(days=ANALYTICS_LOOKBACK_DAYS)

    predictions = (
        db.query(Prediction)
        .filter(
            Prediction.user_id == analyst_id,
            Prediction.status != PREDICTION_STATUS_INVALID,
        )
        .all()
    )

    rank, rank_total, net_rr_30d = compute_leaderboard_rank(
        db, analyst_id, now=now
    )

    wins_30d = losses_30d = expired_30d = 0
    resolved_30d_rows: list[tuple[datetime, float]] = []

    lifetime_wins = lifetime_losses = lifetime_expired = 0
    active_count = 0
    return_sum = 0.0
    return_count = 0

    long_resolved = short_resolved = 0
    asset_counter: Counter[str] = Counter()
    confidence_sum = 0.0
    confidence_count = 0
    setup_rr_sum = 0.0
    setup_rr_count = 0

    for row in predictions:
        if row.status == PREDICTION_STATUS_ACTIVE:
            active_count += 1

        if _is_resolved(row):
            setup_rr = _prediction_setup_rr(row)
            setup_rr_sum += setup_rr
            setup_rr_count += 1
            confidence_sum += float(row.confidence)
            confidence_count += 1
            asset_counter[row.asset] += 1

            if row.position == POSITION_LONG:
                long_resolved += 1
            else:
                short_resolved += 1

            if row.outcome == OUTCOME_WIN:
                lifetime_wins += 1
            elif row.outcome == OUTCOME_LOSS:
                lifetime_losses += 1
            else:
                lifetime_expired += 1

            if row.return_pct is not None:
                return_sum += float(row.return_pct) * 100.0
                return_count += 1

            if row.resolved_at and row.resolved_at >= since:
                if row.outcome == OUTCOME_WIN:
                    wins_30d += 1
                elif row.outcome == OUTCOME_LOSS:
                    losses_30d += 1
                else:
                    expired_30d += 1
                delta = net_rr_contribution(row.outcome, setup_rr)
                resolved_30d_rows.append((row.resolved_at, delta))

    resolved_30d_rows.sort(key=lambda item: item[0])
    cumulative = 0.0
    series: list[NetRrSeriesPoint] = []
    for resolved_at, delta in resolved_30d_rows:
        cumulative = round(cumulative + delta, 2)
        series.append(
            NetRrSeriesPoint(
                resolved_at=resolved_at, cumulative_net_rr=cumulative
            )
        )

    resolved_30d = wins_30d + losses_30d + expired_30d
    recent_30d = AnalyticsPeriodStats(
        net_rr=net_rr_30d,
        win_rate_percent=_win_rate_percent(wins_30d, losses_30d),
        resolved_count=resolved_30d,
        wins=wins_30d,
        losses=losses_30d,
        expired=expired_30d,
    )

    lifetime_resolved = lifetime_wins + lifetime_losses + lifetime_expired
    lifetime = AnalyticsLifetimeStats(
        total_predictions=len(predictions),
        active_count=active_count,
        resolved_count=lifetime_resolved,
        wins=lifetime_wins,
        losses=lifetime_losses,
        expired=lifetime_expired,
        win_rate_percent=_win_rate_percent(lifetime_wins, lifetime_losses),
        average_return_percent=(
            round(return_sum / return_count, 2) if return_count > 0 else None
        ),
    )

    resolved_for_style = long_resolved + short_resolved
    long_pct = (
        round(100.0 * long_resolved / resolved_for_style, 1)
        if resolved_for_style > 0
        else None
    )
    short_pct = (
        round(100.0 * short_resolved / resolved_for_style, 1)
        if resolved_for_style > 0
        else None
    )
    top_assets = tuple(
        AssetCount(asset=asset, count=count)
        for asset, count in asset_counter.most_common(ANALYTICS_TOP_ASSETS_LIMIT)
    )
    style = AnalyticsTradingStyle(
        long_count=long_resolved,
        short_count=short_resolved,
        long_percent=long_pct,
        short_percent=short_pct,
        top_assets=top_assets,
        average_confidence=(
            round(confidence_sum / confidence_count, 2)
            if confidence_count > 0
            else None
        ),
        average_setup_rr=(
            round(setup_rr_sum / setup_rr_count, 2)
            if setup_rr_count > 0
            else None
        ),
    )

    return PredictionAnalyticsDashboard(
        rank=rank,
        rank_total=rank_total,
        net_rr_30d=net_rr_30d,
        recent_30d=recent_30d,
        net_rr_series_30d=tuple(series),
        lifetime=lifetime,
        style=style,
    )


def get_own_analytics_dashboard(
    db: Session, viewer_id: UUID
) -> tuple[User, PredictionAnalyticsDashboard]:
    if not is_analyst_user(db, viewer_id):
        raise AnalystRequiredError(
            "Analyst subscription required to view your analytics."
        )
    user = db.get(User, viewer_id)
    if user is None:
        raise ValueError("User not found")
    return user, build_analytics_dashboard(db, viewer_id)


def get_analyst_dashboard_for_investor(
    db: Session, investor_id: UUID, username: str
) -> tuple[User, PredictionAnalyticsDashboard]:
    assert_investor_user(db, investor_id)
    analyst = get_user_by_username(db, username)
    if analyst is None:
        raise LookupError("Analyst not found")
    assert_analyst_target(db, analyst.id)
    return analyst, build_analytics_dashboard(db, analyst.id)


# Backward-compatible helpers for legacy summary fields
@dataclass(frozen=True)
class PredictionAnalyticsSummary:
    total_predictions: int
    wins: int
    losses: int
    win_rate_percent: Optional[float]
    rank: Optional[int]


def get_own_analytics(
    db: Session, viewer_id: UUID
) -> tuple[User, PredictionAnalyticsSummary]:
    user, dashboard = get_own_analytics_dashboard(db, viewer_id)
    life = dashboard.lifetime
    return user, PredictionAnalyticsSummary(
        total_predictions=life.total_predictions,
        wins=life.wins,
        losses=life.losses,
        win_rate_percent=life.win_rate_percent,
        rank=dashboard.rank,
    )


def get_analyst_analytics_for_investor(
    db: Session, investor_id: UUID, username: str
) -> tuple[User, PredictionAnalyticsSummary]:
    user, dashboard = get_analyst_dashboard_for_investor(
        db, investor_id, username
    )
    life = dashboard.lifetime
    return user, PredictionAnalyticsSummary(
        total_predictions=life.total_predictions,
        wins=life.wins,
        losses=life.losses,
        win_rate_percent=life.win_rate_percent,
        rank=dashboard.rank,
    )
