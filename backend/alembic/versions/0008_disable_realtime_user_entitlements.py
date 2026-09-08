"""disable realtime on user_entitlements

Removes user_entitlements from the Supabase realtime publication. Billing state
is delivered via Stripe webhooks + the /billing/status endpoint, so realtime on
this table is unused.

Revision ID: 0008_disable_realtime_ue
Revises: 0007_cancel_at_period_end
Create Date: 2026-06-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008_disable_realtime_ue"
down_revision: Union[str, None] = "0007_cancel_at_period_end"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PUBLICATION = "supabase_realtime"
TABLE = "user_entitlements"


def _publication_exists(conn) -> bool:
    return (
        conn.execute(
            sa.text("SELECT 1 FROM pg_publication WHERE pubname = :pub"),
            {"pub": PUBLICATION},
        ).first()
        is not None
    )


def _table_in_publication(conn) -> bool:
    return (
        conn.execute(
            sa.text(
                "SELECT 1 FROM pg_publication_tables "
                "WHERE pubname = :pub AND tablename = :tbl"
            ),
            {"pub": PUBLICATION, "tbl": TABLE},
        ).first()
        is not None
    )


def upgrade() -> None:
    conn = op.get_bind()
    if _publication_exists(conn) and _table_in_publication(conn):
        op.execute(f"ALTER PUBLICATION {PUBLICATION} DROP TABLE {TABLE}")


def downgrade() -> None:
    conn = op.get_bind()
    if _publication_exists(conn) and not _table_in_publication(conn):
        op.execute(f"ALTER PUBLICATION {PUBLICATION} ADD TABLE {TABLE}")
