"""add cancel_at_period_end to user_entitlements

Revision ID: 0007_cancel_at_period_end
Revises: 0006_past_due_grace
Create Date: 2026-06-25

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0007_cancel_at_period_end"
down_revision: Union[str, None] = "0006_past_due_grace"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "user_entitlements" not in insp.get_table_names():
        return

    columns = {col["name"] for col in insp.get_columns("user_entitlements")}
    if "cancel_at_period_end" not in columns:
        op.add_column(
            "user_entitlements",
            sa.Column(
                "cancel_at_period_end",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )

def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "user_entitlements" not in insp.get_table_names():
        return

    columns = {col["name"] for col in insp.get_columns("user_entitlements")}
    if "cancel_at_period_end" in columns:
        op.drop_column("user_entitlements", "cancel_at_period_end")
