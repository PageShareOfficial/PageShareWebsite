from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    pass


# Import models so Alembic / Base.metadata can see all tables.
# (Imports are placed at the bottom to avoid circular imports.)
from . import (  # noqa: E402,F401
    user,
    post,
    comment,
    ticker,
    post_ticker,
    reaction,
    repost,
    follow,
    bookmark,
    poll,
    poll_vote,
    content_filter,
    report,
    user_interest,
    watchlist_item,
    error_log,
    user_session,
)

