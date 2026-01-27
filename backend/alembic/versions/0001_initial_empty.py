"""empty initial revision to verify alembic setup

Revision ID: 0001_initial_empty
Revises: 
Create Date: 2026-01-27 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0001_initial_empty"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: first revision just to confirm wiring.
    pass


def downgrade() -> None:
    # No-op downgrade for the empty initial revision.
    pass


