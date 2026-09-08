"""add past_due_grace_ends_at to user_entitlements

Revision ID: 0006_past_due_grace
Revises: 0005_user_entitlements
Create Date: 2026-06-10

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0006_past_due_grace"
down_revision: Union[str, None] = "0005_user_entitlements"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "user_entitlements" not in insp.get_table_names():
        return

    columns = {col["name"] for col in insp.get_columns("user_entitlements")}
    if "past_due_grace_ends_at" not in columns:
        op.add_column(
            "user_entitlements",
            sa.Column("past_due_grace_ends_at", sa.DateTime(timezone=True), nullable=True),
        )

def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "user_entitlements" not in insp.get_table_names():
        return

    columns = {col["name"] for col in insp.get_columns("user_entitlements")}
    if "past_due_grace_ends_at" in columns:
        op.drop_column("user_entitlements", "past_due_grace_ends_at")
