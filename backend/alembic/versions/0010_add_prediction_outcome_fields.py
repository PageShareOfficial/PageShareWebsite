"""add prediction outcome / evaluate fields

Revision ID: 0010_prediction_outcome
Revises: 0009_predictions
Create Date: 2026-07-20

Note: this migration adds new columns and a check constraint to the predictions table and take the RLS into account from 0009_predictions.
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0010_prediction_outcome"
down_revision: Union[str, None] = "0009_predictions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SETTLE_INDEX = "ix_predictions_user_status_expiry"
OUTCOME_CHECK = "predictions_outcome_check"
OUTCOME_CHECK_SQL = (
    "outcome IS NULL OR outcome IN ('win', 'loss', 'expired')"
)

NEW_COLUMNS = (
    "outcome",
    "resolved_at",
    "hit_price",
    "hit_at",
    "return_pct",
    "resolution_source",
    "resolution_note",
)

def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        return

    columns = {col["name"] for col in insp.get_columns("predictions")}

    if "outcome" not in columns:
        op.add_column(
            "predictions",
            sa.Column("outcome", sa.String(20), nullable=True),
        )
    if "resolved_at" not in columns:
        op.add_column(
            "predictions",
            sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "hit_price" not in columns:
        op.add_column(
            "predictions",
            sa.Column("hit_price", sa.Numeric(24, 8), nullable=True),
        )
    if "hit_at" not in columns:
        op.add_column(
            "predictions",
            sa.Column("hit_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "return_pct" not in columns:
        op.add_column(
            "predictions",
            sa.Column("return_pct", sa.Numeric(18, 8), nullable=True),
        )
    if "resolution_source" not in columns:
        op.add_column(
            "predictions",
            sa.Column("resolution_source", sa.String(40), nullable=True),
        )
    if "resolution_note" not in columns:
        op.add_column(
            "predictions",
            sa.Column("resolution_note", sa.Text(), nullable=True),
        )

    existing_checks = {
        constraint["name"]
        for constraint in insp.get_check_constraints("predictions")
    }
    if OUTCOME_CHECK not in existing_checks:
        op.create_check_constraint(
            OUTCOME_CHECK,
            "predictions",
            OUTCOME_CHECK_SQL,
        )

    existing_indexes = {idx["name"] for idx in insp.get_indexes("predictions")}
    if SETTLE_INDEX not in existing_indexes:
        op.create_index(
            SETTLE_INDEX,
            "predictions",
            ["user_id", "status", "expiry_at"],
        )

def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        return

    existing_indexes = {idx["name"] for idx in insp.get_indexes("predictions")}
    if SETTLE_INDEX in existing_indexes:
        op.drop_index(SETTLE_INDEX, table_name="predictions")

    existing_checks = {
        constraint["name"]
        for constraint in insp.get_check_constraints("predictions")
    }
    if OUTCOME_CHECK in existing_checks:
        op.drop_constraint(OUTCOME_CHECK, "predictions", type_="check")

    columns = {col["name"] for col in insp.get_columns("predictions")}
    for column_name in reversed(NEW_COLUMNS):
        if column_name in columns:
            op.drop_column("predictions", column_name)
