"""add saved_analysts for investor bookmarks

Revision ID: 0011_saved_analysts
Revises: 0010_prediction_outcome
Create Date: 2026-07-24

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0011_saved_analysts"
down_revision: Union[str, None] = "0010_prediction_outcome"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SELECT_OWN_POLICY = "saved_analysts_select_own"

def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "saved_analysts" not in insp.get_table_names():
        op.create_table(
            "saved_analysts",
            sa.Column("investor_id", UUID(as_uuid=True), nullable=False),
            sa.Column("analyst_id", UUID(as_uuid=True), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["investor_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["analyst_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("investor_id", "analyst_id"),
            sa.CheckConstraint(
                "investor_id != analyst_id",
                name="saved_analysts_no_self_save",
            ),
        )
        op.create_index(
            "ix_saved_analysts_investor_created_at",
            "saved_analysts",
            ["investor_id", "created_at"],
        )

    op.execute("ALTER TABLE saved_analysts ENABLE ROW LEVEL SECURITY")
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies
                WHERE schemaname = 'public'
                  AND tablename = 'saved_analysts'
                  AND policyname = '{SELECT_OWN_POLICY}'
            ) THEN
                CREATE POLICY {SELECT_OWN_POLICY}
                ON public.saved_analysts
                FOR SELECT
                TO authenticated
                USING (investor_id = auth.uid());
            END IF;
        END $$;
        """
    )

def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    if "saved_analysts" not in insp.get_table_names():
        return

    op.execute(f"DROP POLICY IF EXISTS {SELECT_OWN_POLICY} ON public.saved_analysts")
    op.execute("ALTER TABLE saved_analysts DISABLE ROW LEVEL SECURITY")
    op.drop_index("ix_saved_analysts_investor_created_at", table_name="saved_analysts")
    op.drop_table("saved_analysts")
