"""
Metrics endpoints: GET /metrics/dashboard, /users, /engagement, /growth, /health, /trending, /export.
Admin only (user.badge == 'admin').
"""
from datetime import date
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import require_admin
from app.schemas.metrics import (
    EngagementMetrics,
    GrowthMetrics,
    HealthMetrics,
    TrendingMetrics,
    UserMetrics,
    TrendingTickerItem,
    MostActiveUserItem,
)
from app.services.auth_service import CurrentUser
from app.services.metrics_service import (
    get_dashboard_metrics,
    get_user_metrics,
    get_engagement_metrics_full,
    get_growth_metrics,
    get_health_metrics,
    get_trending_metrics,
    export_metrics,
)

router = APIRouter(prefix="/metrics", tags=["metrics"])

def _user_metrics_response(data: Dict[str, Any]) -> UserMetrics:
    return UserMetrics(
        dau=data.get("dau", 0),
        mau=data.get("mau", 0),
        total_users=data.get("total_users", 0),
        new_signups=data.get("new_signups", {}),
        active_users=data.get("active_users", {}),
        retention=data.get("retention"),
        churn_rate=data.get("churn_rate"),
    )

def _engagement_response(data: Dict[str, Any]) -> EngagementMetrics:
    return EngagementMetrics(
        total_posts=data.get("total_posts", 0),
        total_comments=data.get("total_comments", 0),
        total_reactions=data.get("total_reactions", 0),
        total_reposts=data.get("total_reposts", 0),
        users_with_posts=data.get("users_with_posts", 0),
        avg_posts_per_user=data.get("avg_posts_per_user", 0.0),
        avg_comments_per_post=data.get("avg_comments_per_post", 0.0),
        avg_reactions_per_post=data.get("avg_reactions_per_post", 0.0),
        avg_reposts_per_post=data.get("avg_reposts_per_post", 0.0),
        total_posts_period=data.get("total_posts_period"),
        total_reactions_period=data.get("total_reactions_period"),
        total_comments_period=data.get("total_comments_period"),
        content_types=data.get("content_types"),
    )

def _health_response(data: Dict[str, Any]) -> HealthMetrics:
    return HealthMetrics(
        api=data.get("api", {}),
        database=data.get("database", {}),
        storage=data.get("storage", {}),
        errors=data.get("errors", {}),
    )

def _trending_response(data: Dict[str, Any]) -> TrendingMetrics:
    tickers = [
        TrendingTickerItem(
            symbol=t.get("symbol", ""),
            mentions=t.get("mentions", 0),
            mentions_24h=t.get("mentions_24h", 0),
            growth=t.get("growth"),
        )
        for t in data.get("trending_tickers", [])
    ]
    users = [
        MostActiveUserItem(
            username=u.get("username", ""),
            posts_count=u.get("posts_count", 0),
            engagement_score=u.get("engagement_score"),
        )
        for u in data.get("most_active_users", [])
    ]
    return TrendingMetrics(
        trending_tickers=tickers,
        trending_posts=data.get("trending_posts", []),
        most_active_users=users,
    )

@router.get("/dashboard", response_model=dict)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get combined dashboard metrics (user, engagement, growth, health, trending). Auth required."""
    raw = get_dashboard_metrics(db)
    user_metrics = _user_metrics_response(raw.get("user_metrics", {}))
    engagement_metrics = _engagement_response(raw.get("engagement_metrics", {}))
    growth_metrics = GrowthMetrics(**raw.get("growth_metrics", {}))
    platform_health = _health_response(raw.get("platform_health", {}))
    trending = _trending_response(raw.get("trending", {})) if raw.get("trending") else None
    return {
        "data": {
            "user_metrics": user_metrics.model_dump(),
            "engagement_metrics": engagement_metrics.model_dump(),
            "growth_metrics": growth_metrics.model_dump(),
            "platform_health": platform_health.model_dump(),
            "trending": trending.model_dump() if trending else None,
            "geographic_distribution": raw.get("geographic_distribution", []),
            "timestamp": raw.get("timestamp"),
        },
    }

@router.get("/users", response_model=dict)
def get_users_metrics(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get user metrics (DAU, MAU, signups, active users). Admin only."""
    data = get_user_metrics(db)
    return {"data": _user_metrics_response(data).model_dump()}

@router.get("/engagement", response_model=dict)
def get_engagement(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get engagement metrics (posts, comments, reactions, averages). Admin only."""
    data = get_engagement_metrics_full(db)
    return {"data": _engagement_response(data).model_dump()}

@router.get("/growth", response_model=dict)
def get_growth(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get growth metrics (week-over-week, month-over-month). Admin only."""
    data = get_growth_metrics(db)
    return {"data": GrowthMetrics(**data).model_dump()}

@router.get("/health", response_model=dict)
def get_health(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Get platform health (errors, optional API/DB/storage). Admin only."""
    data = get_health_metrics(db)
    return {"data": _health_response(data).model_dump()}

@router.get("/trending", response_model=dict)
def get_trending(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
    limit: int = Query(10, ge=1, le=50),
):
    """Get trending tickers and most active users. Admin only."""
    data = get_trending_metrics(db, limit=limit)
    return {"data": _trending_response(data).model_dump()}

@router.get("/export")
def export_metrics_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
    format: str = Query("json", description="json or csv"),
    metric_type: str = Query("all", description="users, engagement, growth, health, all"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
):
    """Export metrics as JSON or CSV. Admin only."""
    fmt = format.strip().lower() if format else "json"
    if fmt not in ("json", "csv"):
        fmt = "json"
    mtype = metric_type.strip().lower() if metric_type else "all"
    if mtype not in ("users", "engagement", "growth", "health", "all"):
        mtype = "all"
    content, content_type = export_metrics(db, format=fmt, metric_type=mtype, date_from=date_from, date_to=date_to)
    return Response(content=content, media_type=content_type)
