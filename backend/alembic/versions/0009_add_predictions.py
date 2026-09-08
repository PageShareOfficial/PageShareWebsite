"""add predictions table

Revision ID: 0009_predictions
Revises: 0008_disable_realtime_ue
Create Date: 2026-07-09

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0009_predictions"
down_revision: Union[str, None] = "0008_disable_realtime_ue"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SELECT_OWN_POLICY = "predictions_select_own"

def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        op.create_table(
            "predictions",
            sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
            sa.Column("user_id", UUID(as_uuid=True), nullable=False),
            sa.Column("asset", sa.String(32), nullable=False),
            sa.Column("asset_name", sa.String(120), nullable=True),
            sa.Column("prediction_type", sa.String(20), server_default="target", nullable=False),
            sa.Column("position", sa.String(10), nullable=False),
            sa.Column("entry_price", sa.Numeric(24, 8), nullable=False),
            sa.Column("target_price", sa.Numeric(24, 8), nullable=False),
            sa.Column("stop_loss", sa.Numeric(24, 8), nullable=False),
            sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
            sa.Column("expiry_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("lock_started_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("confidence", sa.Numeric(5, 4), nullable=False),
            sa.Column("thesis", sa.Text(), nullable=False),
            sa.Column("thesis_image_url", sa.Text(), nullable=True),
            sa.Column("status", sa.String(20), server_default="active", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.CheckConstraint("position IN ('long', 'short')", name="predictions_position_check"),
            sa.CheckConstraint(
                "status IN ('active', 'completed', 'expired', 'invalid')",
                name="predictions_status_check",
            ),
            sa.CheckConstraint("char_length(thesis) <= 300", name="predictions_thesis_max_length"),
        )
        op.create_index("ix_predictions_user_id", "predictions", ["user_id"])
        op.create_index("ix_predictions_user_created_at", "predictions", ["user_id", "created_at"])

    # RLS: analysts may read their own predictions via Supabase client JWT.
    # Inserts/updates go through FastAPI (service role). Investor analytics and
    # leaderboard reads also go through FastAPI with entitlement checks.
    op.execute("ALTER TABLE predictions ENABLE ROW LEVEL SECURITY")
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies
                WHERE schemaname = 'public'
                  AND tablename = 'predictions'
                  AND policyname = '{SELECT_OWN_POLICY}'
            ) THEN
                CREATE POLICY {SELECT_OWN_POLICY}
                ON public.predictions
                FOR SELECT
                TO authenticated
                USING (user_id = auth.uid());
            END IF;
        END $$;
        """
    )

def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "predictions" not in insp.get_table_names():
        return

    op.execute(f"DROP POLICY IF EXISTS {SELECT_OWN_POLICY} ON public.predictions")
    op.execute("ALTER TABLE predictions DISABLE ROW LEVEL SECURITY")
    op.drop_index("ix_predictions_user_created_at", table_name="predictions")
    op.drop_index("ix_predictions_user_id", table_name="predictions")
    op.drop_table("predictions")
