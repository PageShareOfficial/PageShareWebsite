"""add recent_searches table

Revision ID: 0004_recent_searches
Revises: 0003_admin_badge
Create Date: 2026-02-14

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0004_recent_searches"
down_revision: Union[str, None] = "0003_admin_badge"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recent_searches",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("result_id", sa.String(255), nullable=False),
        sa.Column("query", sa.String(255), nullable=False),
        sa.Column("result_display_name", sa.String(255), nullable=True),
        sa.Column("result_image_url", sa.String(2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_recent_searches_user_id", "recent_searches", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_recent_searches_user_id", table_name="recent_searches")
    op.drop_table("recent_searches")
