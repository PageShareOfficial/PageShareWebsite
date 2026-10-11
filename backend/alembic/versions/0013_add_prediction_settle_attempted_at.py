"""add settle_attempted_at on predictions for the scheduled settle queue

Revision ID: 0013_prediction_settle_attempt
Revises: 0012_prediction_polygon_anchor
Create Date: 2026-10-12

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0013_prediction_settle_attempt"
down_revision: Union[str, None] = "0012_prediction_polygon_anchor"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMN_NAME = "settle_attempted_at"
SETTLE_QUEUE_INDEX = "ix_predictions_settle_queue"

def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        return

    columns = {col["name"] for col in insp.get_columns("predictions")}
    if COLUMN_NAME not in columns:
        op.add_column(
            "predictions",
            sa.Column(COLUMN_NAME, sa.DateTime(timezone=True), nullable=True),
        )

    existing_indexes = {idx["name"] for idx in insp.get_indexes("predictions")}
    if SETTLE_QUEUE_INDEX not in existing_indexes:
        op.create_index(
            SETTLE_QUEUE_INDEX,
            "predictions",
            [COLUMN_NAME, "expiry_at"],
            postgresql_where=sa.text("status = 'active' AND outcome IS NULL"),
        )

def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        return

    existing_indexes = {idx["name"] for idx in insp.get_indexes("predictions")}
    if SETTLE_QUEUE_INDEX in existing_indexes:
        op.drop_index(SETTLE_QUEUE_INDEX, table_name="predictions")

    columns = {col["name"] for col in insp.get_columns("predictions")}
    if COLUMN_NAME in columns:
        op.drop_column("predictions", COLUMN_NAME)
