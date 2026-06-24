"""add user_entitlements table for Stripe subscriptions

Revision ID: 0005_user_entitlements
Revises: 0004_recent_searches
Create Date: 2026-06-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0005_user_entitlements"
down_revision: Union[str, None] = "0004_recent_searches"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SELECT_POLICY = "user_entitlements_select_own"


def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "user_entitlements" not in insp.get_table_names():
        op.create_table(
            "user_entitlements",
            sa.Column("user_id", UUID(as_uuid=True), nullable=False),
            sa.Column("stripe_customer_id", sa.String(255), nullable=True),
            sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
            sa.Column("plan_id", sa.String(20), nullable=True),
            sa.Column("interval", sa.String(20), nullable=True),
            sa.Column("status", sa.String(32), server_default="none", nullable=False),
            sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("user_id"),
            sa.UniqueConstraint(
                "stripe_customer_id",
                name="uq_user_entitlements_stripe_customer_id",
            ),
        )

    # RLS: users may read their own row only; writes go through FastAPI (service role).
    op.execute("ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY")
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies
                WHERE schemaname = 'public'
                  AND tablename = 'user_entitlements'
                  AND policyname = '{SELECT_POLICY}'
            ) THEN
                CREATE POLICY {SELECT_POLICY}
                ON public.user_entitlements
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
    if "user_entitlements" not in insp.get_table_names():
        return

    op.execute(f"DROP POLICY IF EXISTS {SELECT_POLICY} ON public.user_entitlements")
    op.execute("ALTER TABLE user_entitlements DISABLE ROW LEVEL SECURITY")
    op.drop_table("user_entitlements")
