"""add onboarded_at on users as the explicit "finished onboarding" flag

Replaces the old rule "username starts with user_ means not onboarded". Existing users with a
chosen username are backfilled as onboarded; placeholder rows stay NULL and still see onboarding.

Revision ID: 0014_user_onboarded_at
Revises: 0013_prediction_settle_attempt
Create Date: 2026-10-15

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0014_user_onboarded_at"
down_revision: Union[str, None] = "0013_prediction_settle_attempt"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMN_NAME = "onboarded_at"

# `_` is a LIKE wildcard, so it must be escaped to match the literal placeholder prefix.
BACKFILL_ONBOARDED_USERS = sa.text(
    r"""
    UPDATE users
    SET onboarded_at = created_at
    WHERE onboarded_at IS NULL
      AND username NOT LIKE 'user\_%' ESCAPE '\'
    """
)

def _user_columns() -> set[str]:
    """Column names of `users`, or an empty set when the table does not exist yet."""
    insp = inspect(op.get_bind())
    if "users" not in insp.get_table_names():
        return set()
    return {col["name"] for col in insp.get_columns("users")}

def upgrade() -> None:
    columns = _user_columns()
    if not columns:
        return
    if COLUMN_NAME not in columns:
        op.add_column("users", sa.Column(COLUMN_NAME, sa.DateTime(timezone=True), nullable=True))
    op.execute(BACKFILL_ONBOARDED_USERS)

def downgrade() -> None:
    if COLUMN_NAME in _user_columns():
        op.drop_column("users", COLUMN_NAME)
