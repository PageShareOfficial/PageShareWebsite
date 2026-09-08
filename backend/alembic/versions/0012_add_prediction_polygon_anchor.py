"""add polygon hash-anchor columns on predictions

Revision ID: 0012_prediction_polygon_anchor
Revises: 0011_saved_analysts
Create Date: 2026-08-18

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0012_prediction_polygon_anchor"
down_revision: Union[str, None] = "0011_saved_analysts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ANCHOR_STATUS_CHECK = "predictions_anchor_status_check"
ANCHOR_STATUS_SQL = (
    "anchor_status IN ('none', 'pending', 'submitted', 'confirmed', 'failed')"
)
RETRY_INDEX = "ix_predictions_anchor_retry"
NEW_COLUMNS = (
    "content_hash",
    "anchor_status",
    "chain_tx_hash",
    "chain_id",
    "anchored_at",
)

def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        return

    columns = {col["name"] for col in insp.get_columns("predictions")}
    if "content_hash" not in columns:
        op.add_column(
            "predictions",
            sa.Column("content_hash", sa.String(64), nullable=True),
        )
    if "anchor_status" not in columns:
        op.add_column(
            "predictions",
            sa.Column(
                "anchor_status",
                sa.String(20),
                nullable=False,
                server_default="none",
            ),
        )
    if "chain_tx_hash" not in columns:
        op.add_column(
            "predictions",
            sa.Column("chain_tx_hash", sa.String(66), nullable=True),
        )
    if "chain_id" not in columns:
        op.add_column(
            "predictions",
            sa.Column("chain_id", sa.Integer(), nullable=True),
        )
    if "anchored_at" not in columns:
        op.add_column(
            "predictions",
            sa.Column("anchored_at", sa.DateTime(timezone=True), nullable=True),
        )

    existing_checks = {
        constraint["name"] for constraint in insp.get_check_constraints("predictions")
    }
    if ANCHOR_STATUS_CHECK not in existing_checks:
        op.create_check_constraint(
            ANCHOR_STATUS_CHECK,
            "predictions",
            ANCHOR_STATUS_SQL,
        )

    existing_indexes = {idx["name"] for idx in insp.get_indexes("predictions")}
    if RETRY_INDEX not in existing_indexes:
        op.create_index(
            RETRY_INDEX,
            "predictions",
            ["created_at"],
            postgresql_where=sa.text(
                "anchor_status IN ('pending', 'failed', 'submitted')"
            ),
        )

def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        return

    existing_indexes = {idx["name"] for idx in insp.get_indexes("predictions")}
    if RETRY_INDEX in existing_indexes:
        op.drop_index(RETRY_INDEX, table_name="predictions")

    existing_checks = {
        constraint["name"] for constraint in insp.get_check_constraints("predictions")
    }
    if ANCHOR_STATUS_CHECK in existing_checks:
        op.drop_constraint(ANCHOR_STATUS_CHECK, "predictions", type_="check")

    columns = {col["name"] for col in insp.get_columns("predictions")}
    for column_name in reversed(NEW_COLUMNS):
        if column_name in columns:
            op.drop_column("predictions", column_name)
