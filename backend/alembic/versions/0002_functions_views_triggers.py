"""add functions, triggers, views and materialized views

Revision ID: 0002_functions_views
Revises: 74db0ac72c88
Create Date: 2026-01-28

"""
from typing import Sequence, Union

from alembic import op


revision: str = "0002_functions_views"
down_revision: Union[str, None] = "74db0ac72c88"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- 2. Function: update_updated_at() ----
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # ---- 2. Triggers on posts, comments, users ----
    op.execute("""
        CREATE TRIGGER posts_updated_at
            BEFORE UPDATE ON posts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    """)
    op.execute("""
        CREATE TRIGGER comments_updated_at
            BEFORE UPDATE ON comments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    """)
    op.execute("""
        CREATE TRIGGER users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    """)

    # ---- 3. View: post_stats ----
    op.execute("""
        CREATE VIEW post_stats AS
        SELECT
            p.id AS post_id,
            COUNT(DISTINCT r.id) AS reaction_count,
            COUNT(DISTINCT c.id) AS comment_count,
            COUNT(DISTINCT rp.id) AS repost_count,
            COUNT(DISTINCT b.id) AS bookmark_count
        FROM posts p
        LEFT JOIN reactions r ON r.post_id = p.id
        LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
        LEFT JOIN reposts rp ON rp.post_id = p.id
        LEFT JOIN bookmarks b ON b.post_id = p.id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id;
    """)

    # ---- 4. Materialized view: trending_tickers ----
    op.execute("""
        CREATE MATERIALIZED VIEW trending_tickers AS
        SELECT
            t.id AS ticker_id,
            t.symbol,
            t.name,
            COUNT(DISTINCT pt.post_id) AS mention_count,
            COUNT(DISTINCT pt.post_id) FILTER (WHERE p.created_at >= NOW() - INTERVAL '24 hours') AS mentions_24h,
            MAX(p.created_at) AS last_mentioned_at
        FROM tickers t
        JOIN post_tickers pt ON pt.ticker_id = t.id
        JOIN posts p ON p.id = pt.post_id AND p.deleted_at IS NULL
        GROUP BY t.id, t.symbol, t.name
        ORDER BY mentions_24h DESC, mention_count DESC;
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_trending_tickers_ticker_id ON trending_tickers(ticker_id);"
    )

    # ---- 5. Materialized view: daily_metrics ----
    op.execute("""
        CREATE MATERIALIZED VIEW daily_metrics AS
        SELECT
            DATE(created_at) AS metric_date,
            COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW())) AS dau,
            COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '30 days') AS mau,
            COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW())) AS posts_today,
            COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '7 days') AS posts_7d,
            COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '30 days') AS posts_30d,
            COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW())) AS new_users_today,
            COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '7 days') AS new_users_7d,
            COUNT(DISTINCT user_id) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '30 days') AS new_users_30d
        FROM posts
        WHERE deleted_at IS NULL
        GROUP BY DATE(created_at);
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);"
    )

    # ---- 6. Materialized view: engagement_metrics ----
    op.execute("""
        CREATE MATERIALIZED VIEW engagement_metrics AS
        SELECT
            COUNT(DISTINCT p.id) AS total_posts,
            COUNT(DISTINCT c.id) AS total_comments,
            COUNT(DISTINCT r.id) AS total_reactions,
            COUNT(DISTINCT rp.id) AS total_reposts,
            COUNT(DISTINCT p.user_id) AS users_with_posts,
            ROUND(COUNT(DISTINCT p.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.user_id), 0), 2) AS avg_posts_per_user,
            ROUND(COUNT(DISTINCT c.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS avg_comments_per_post,
            ROUND(COUNT(DISTINCT r.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS avg_reactions_per_post,
            ROUND(COUNT(DISTINCT rp.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0), 2) AS avg_reposts_per_post
        FROM posts p
        LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
        LEFT JOIN reactions r ON r.post_id = p.id
        LEFT JOIN reposts rp ON rp.post_id = p.id
        WHERE p.deleted_at IS NULL;
    """)


def downgrade() -> None:
    # Drop in reverse order of creation; materialized views and view first, then triggers, then function.

    op.execute("DROP MATERIALIZED VIEW IF EXISTS engagement_metrics;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS daily_metrics;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS trending_tickers;")
    op.execute("DROP VIEW IF EXISTS post_stats;")

    op.execute("DROP TRIGGER IF EXISTS users_updated_at ON users;")
    op.execute("DROP TRIGGER IF EXISTS comments_updated_at ON comments;")
    op.execute("DROP TRIGGER IF EXISTS posts_updated_at ON posts;")

    op.execute("DROP FUNCTION IF EXISTS update_updated_at();")
