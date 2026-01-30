"""
Metrics response schemas for GET /metrics/* and export.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class UserMetrics(BaseModel):
    """User metrics (DAU, MAU, signups, retention, etc.)."""

    dau: int = 0
    mau: int = 0
    total_users: int = 0
    new_signups: Dict[str, int] = Field(default_factory=lambda: {"today": 0, "this_week": 0, "this_month": 0})
    active_users: Dict[str, int] = Field(default_factory=lambda: {"today": 0, "this_week": 0, "this_month": 0})
    retention: Optional[Dict[str, float]] = None
    churn_rate: Optional[float] = None

class EngagementMetrics(BaseModel):
    """Engagement metrics (posts, comments, reactions, reposts, averages)."""

    total_posts: int = 0
    total_comments: int = 0
    total_reactions: int = 0
    total_reposts: int = 0
    users_with_posts: int = 0
    avg_posts_per_user: float = 0.0
    avg_comments_per_post: float = 0.0
    avg_reactions_per_post: float = 0.0
    avg_reposts_per_post: float = 0.0
    total_posts_period: Optional[Dict[str, int]] = None
    total_reactions_period: Optional[Dict[str, int]] = None
    total_comments_period: Optional[Dict[str, int]] = None
    content_types: Optional[Dict[str, float]] = None

class GrowthMetrics(BaseModel):
    """Growth metrics (week-over-week, month-over-month)."""

    user_growth: Dict[str, float] = Field(default_factory=lambda: {"week_over_week": 0.0, "month_over_month": 0.0})
    content_growth: Dict[str, float] = Field(default_factory=lambda: {"week_over_week": 0.0, "month_over_month": 0.0})
    engagement_growth: Dict[str, float] = Field(default_factory=lambda: {"week_over_week": 0.0, "month_over_month": 0.0})
    viral_coefficient: Optional[float] = None

class HealthMetrics(BaseModel):
    """Platform health (API, DB, storage, errors)."""

    api: Dict[str, Any] = Field(default_factory=lambda: {"response_time_avg_ms": None, "error_rate": None, "requests_today": None})
    database: Dict[str, Any] = Field(default_factory=lambda: {"query_time_avg_ms": None, "slow_queries_count": None})
    storage: Dict[str, Any] = Field(default_factory=lambda: {"usage_mb": None, "files_count": None})
    errors: Dict[str, int] = Field(default_factory=lambda: {"total_today": 0, "critical_today": 0, "resolved_today": 0})

class TrendingTickerItem(BaseModel):
    """Single trending ticker."""

    symbol: str
    mentions: int = 0
    mentions_24h: int = 0
    growth: Optional[float] = None

class MostActiveUserItem(BaseModel):
    """Most active user summary."""

    username: str
    posts_count: int = 0
    engagement_score: Optional[int] = None

class TrendingMetrics(BaseModel):
    """Trending content (tickers, optional posts/users)."""

    trending_tickers: List[TrendingTickerItem] = Field(default_factory=list)
    trending_posts: List[Dict[str, Any]] = Field(default_factory=list)
    most_active_users: List[MostActiveUserItem] = Field(default_factory=list)

class DashboardMetrics(BaseModel):
    """Combined dashboard payload."""

    user_metrics: UserMetrics = Field(default_factory=UserMetrics)
    engagement_metrics: EngagementMetrics = Field(default_factory=EngagementMetrics)
    growth_metrics: GrowthMetrics = Field(default_factory=GrowthMetrics)
    platform_health: HealthMetrics = Field(default_factory=HealthMetrics)
    trending: Optional[TrendingMetrics] = None
    geographic_distribution: List[Dict[str, Any]] = Field(default_factory=list)
    timestamp: Optional[datetime] = None
