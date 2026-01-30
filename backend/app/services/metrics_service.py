"""
Metrics service: DAU, MAU, engagement, growth, health, trending from materialized views and DB.
"""
from datetime import date, datetime, timedelta, timezone
from io import StringIO
from typing import Any, Dict, List, Optional, Tuple
import csv
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.post import Post
from app.models.error_log import ErrorLog
from app.services.ticker_service import get_trending_tickers

def get_daily_metrics(db: Session) -> Optional[Dict[str, Any]]:
    """Return latest row from daily_metrics materialized view (dau, mau, posts, new users)."""
    try:
        row = db.execute(
            text("""
                SELECT metric_date, dau, mau, posts_today, posts_7d, posts_30d,
                       new_users_today, new_users_7d, new_users_30d
                FROM daily_metrics
                ORDER BY metric_date DESC NULLS LAST
                LIMIT 1
            """)
        ).fetchone()
    except Exception:
        return None
    if not row:
        return None
    return {
        "metric_date": row[0],
        "dau": row[1] or 0,
        "mau": row[2] or 0,
        "posts_today": row[3] or 0,
        "posts_7d": row[4] or 0,
        "posts_30d": row[5] or 0,
        "new_users_today": row[6] or 0,
        "new_users_7d": row[7] or 0,
        "new_users_30d": row[8] or 0,
    }

def get_engagement_metrics(db: Session) -> Optional[Dict[str, Any]]:
    """Return single row from engagement_metrics materialized view."""
    try:
        row = db.execute(
            text("""
                SELECT total_posts, total_comments, total_reactions, total_reposts,
                       users_with_posts, avg_posts_per_user, avg_comments_per_post,
                       avg_reactions_per_post, avg_reposts_per_post
                FROM engagement_metrics
                LIMIT 1
            """)
        ).fetchone()
    except Exception:
        return None
    if not row:
        return None
    return {
        "total_posts": row[0] or 0,
        "total_comments": row[1] or 0,
        "total_reactions": row[2] or 0,
        "total_reposts": row[3] or 0,
        "users_with_posts": row[4] or 0,
        "avg_posts_per_user": float(row[5] or 0),
        "avg_comments_per_post": float(row[6] or 0),
        "avg_reactions_per_post": float(row[7] or 0),
        "avg_reposts_per_post": float(row[8] or 0),
    }

def get_total_users(db: Session) -> int:
    """Count users (not soft-deleted)."""
    return db.query(User).filter(User.deleted_at.is_(None)).count()

def get_user_metrics(db: Session) -> Dict[str, Any]:
    """User metrics: DAU, MAU, total_users, new signups, active users from daily_metrics + users."""
    total_users = get_total_users(db)
    dm = get_daily_metrics(db)
    if dm:
        return {
            "dau": dm["dau"],
            "mau": dm["mau"],
            "total_users": total_users,
            "new_signups": {
                "today": dm["new_users_today"],
                "this_week": dm["new_users_7d"],
                "this_month": dm["new_users_30d"],
            },
            "active_users": {
                "today": dm["dau"],
                "this_week": dm["posts_7d"],  # daily_metrics has posts_7d, not distinct users; reuse for rough active
                "this_month": dm["mau"],
            },
            "retention": None,
            "churn_rate": None,
        }
    return {
        "dau": 0,
        "mau": 0,
        "total_users": total_users,
        "new_signups": {"today": 0, "this_week": 0, "this_month": 0},
        "active_users": {"today": 0, "this_week": 0, "this_month": 0},
        "retention": None,
        "churn_rate": None,
    }

def get_engagement_metrics_full(db: Session) -> Dict[str, Any]:
    """Engagement metrics from view + optional period breakdown from daily_metrics."""
    em = get_engagement_metrics(db)
    dm = get_daily_metrics(db)
    out = {
        "total_posts": 0,
        "total_comments": 0,
        "total_reactions": 0,
        "total_reposts": 0,
        "users_with_posts": 0,
        "avg_posts_per_user": 0.0,
        "avg_comments_per_post": 0.0,
        "avg_reactions_per_post": 0.0,
        "avg_reposts_per_post": 0.0,
        "total_posts_period": {"today": 0, "this_week": 0, "this_month": 0},
        "total_reactions_period": None,
        "total_comments_period": None,
        "content_types": None,
    }
    if em:
        out.update({k: em[k] for k in em})
    if dm:
        out["total_posts_period"] = {
            "today": dm["posts_today"],
            "this_week": dm["posts_7d"],
            "this_month": dm["posts_30d"],
        }
    return out

def get_growth_metrics(db: Session) -> Dict[str, Any]:
    """Growth: week-over-week and month-over-month from direct counts."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today_start - timedelta(days=7)
    two_weeks_ago = today_start - timedelta(days=14)
    month_ago = today_start - timedelta(days=30)
    two_months_ago = today_start - timedelta(days=60)

    def count_users_since(model_created_at_col, since: datetime) -> int:
        return db.query(func.count(User.id)).filter(
            User.deleted_at.is_(None),
            model_created_at_col >= since,
        ).scalar() or 0

    def count_posts_since(since: datetime) -> int:
        return db.query(func.count(Post.id)).filter(
            Post.deleted_at.is_(None),
            Post.created_at >= since,
        ).scalar() or 0

    users_this_week = count_users_since(User.created_at, week_ago)
    users_last_week = count_users_since(User.created_at, two_weeks_ago) - users_this_week
    users_this_month = count_users_since(User.created_at, month_ago)
    users_last_month = count_users_since(User.created_at, two_months_ago) - users_this_month

    posts_this_week = count_posts_since(week_ago)
    posts_last_week = count_posts_since(two_weeks_ago) - posts_this_week
    posts_this_month = count_posts_since(month_ago)
    posts_last_month = count_posts_since(two_months_ago) - posts_this_month

    def wow(current: int, previous: int) -> float:
        if previous == 0:
            return float(current) if current else 0.0
        return round((current - previous) / previous, 4)

    def mom(current: int, previous: int) -> float:
        if previous == 0:
            return float(current) if current else 0.0
        return round((current - previous) / previous, 4)

    return {
        "user_growth": {
            "week_over_week": wow(users_this_week, users_last_week),
            "month_over_month": mom(users_this_month, users_last_month),
        },
        "content_growth": {
            "week_over_week": wow(posts_this_week, posts_last_week),
            "month_over_month": mom(posts_this_month, posts_last_month),
        },
        "engagement_growth": {"week_over_week": 0.0, "month_over_month": 0.0},
        "viral_coefficient": None,
    }

def get_health_metrics(db: Session) -> Dict[str, Any]:
    """Platform health: errors from error_logs, total_users; API/DB/storage placeholders."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total_errors_today = db.query(func.count(ErrorLog.id)).filter(ErrorLog.created_at >= today_start).scalar() or 0
    critical_today = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.created_at >= today_start,
        ErrorLog.severity == "critical",
    ).scalar() or 0
    resolved_today = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.created_at >= today_start,
        ErrorLog.resolved.is_(True),
    ).scalar() or 0
    total_users = get_total_users(db)
    return {
        "api": {
            "response_time_avg_ms": None,
            "error_rate": None,
            "requests_today": None,
        },
        "database": {"query_time_avg_ms": None, "slow_queries_count": None},
        "storage": {"usage_mb": None, "files_count": None},
        "errors": {
            "total_today": total_errors_today,
            "critical_today": critical_today,
            "resolved_today": resolved_today,
        },
        "total_users": total_users,
    }

def get_most_active_users(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Users by post count (most active)."""
    if limit <= 0:
        return []
    limit = min(limit, 50)
    subq = (
        db.query(Post.user_id, func.count(Post.id).label("posts_count"))
        .filter(Post.deleted_at.is_(None))
        .group_by(Post.user_id)
        .subquery()
    )
    rows = (
        db.query(User.username, subq.c.posts_count)
        .join(subq, User.id == subq.c.user_id)
        .filter(User.deleted_at.is_(None))
        .order_by(subq.c.posts_count.desc())
        .limit(limit)
        .all()
    )
    return [{"username": r[0], "posts_count": r[1], "engagement_score": None} for r in rows]

def get_trending_metrics(db: Session, limit: int = 10) -> Dict[str, Any]:
    """Trending tickers (from view) + most active users."""
    tickers = get_trending_tickers(db, limit=limit)
    trending_tickers = [
        {
            "symbol": t["symbol"],
            "mentions": t["mention_count"],
            "mentions_24h": t["mentions_24h"],
            "growth": None,
        }
        for t in tickers
    ]
    most_active = get_most_active_users(db, limit=limit)
    return {
        "trending_tickers": trending_tickers,
        "trending_posts": [],
        "most_active_users": most_active,
    }

def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
    """Combined dashboard: user, engagement, growth, health, trending."""
    user_metrics = get_user_metrics(db)
    engagement = get_engagement_metrics_full(db)
    growth = get_growth_metrics(db)
    health = get_health_metrics(db)
    trending = get_trending_metrics(db, limit=10)
    return {
        "user_metrics": user_metrics,
        "engagement_metrics": engagement,
        "growth_metrics": growth,
        "platform_health": health,
        "trending": trending,
        "geographic_distribution": [],
        "timestamp": datetime.now(timezone.utc),
    }

def export_metrics(
    db: Session,
    format: str,
    metric_type: str,
    date_from: Optional[date],
    date_to: Optional[date],
) -> Tuple[str, str]:
    """
    Export metrics as JSON string or CSV string.
    Returns (content, content_type).
    metric_type: users, engagement, growth, health, all.
    """
    data: Dict[str, Any] = {}
    if metric_type in ("users", "all"):
        data["user_metrics"] = get_user_metrics(db)
    if metric_type in ("engagement", "all"):
        data["engagement_metrics"] = get_engagement_metrics_full(db)
    if metric_type in ("growth", "all"):
        data["growth_metrics"] = get_growth_metrics(db)
    if metric_type in ("health", "all"):
        data["platform_health"] = get_health_metrics(db)
    if metric_type == "all":
        data["trending"] = get_trending_metrics(db, limit=20)

    if format == "csv":
        buf = StringIO()
        writer = csv.writer(buf)
        for key, val in data.items():
            if isinstance(val, dict):
                writer.writerow([key])
                for k, v in val.items():
                    if isinstance(v, (dict, list)):
                        writer.writerow([k, str(v)])
                    else:
                        writer.writerow([k, v])
                writer.writerow([])
        return buf.getvalue(), "text/csv"
    import json
    return json.dumps({"data": data}, default=str), "application/json"
