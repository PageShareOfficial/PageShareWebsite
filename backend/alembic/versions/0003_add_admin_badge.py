"""add admin to users.badge constraint

Revision ID: 0003_admin_badge
Revises: 0002_functions_views
Create Date: 2026-01-27

"""
from typing import Sequence, Union
from alembic import op

revision: str = "0003_admin_badge"
down_revision: Union[str, None] = "0002_functions_views"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.drop_constraint("users_badge_check", "users", type_="check")
    op.create_check_constraint(
        "users_badge_check",
        "users",
        "badge IN ('Verified', 'Public', 'admin')",
    )

def downgrade() -> None:
    op.drop_constraint("users_badge_check", "users", type_="check")
    op.create_check_constraint(
        "users_badge_check",
        "users",
        "badge IN ('Verified', 'Public')",
    )
