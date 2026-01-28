"""create initial tables

Revision ID: 74db0ac72c88
Revises: 0001_initial_empty
Create Date: 2026-01-28 01:03:43.331672

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '74db0ac72c88'
down_revision: Union[str, None] = '0001_initial_empty'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create all tables from SQLAlchemy models (autogenerate wrote empty; use metadata).
    import app.models  # noqa: F401  # register all tables on Base.metadata
    from app.models import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind)


def downgrade() -> None:
    import app.models  # noqa: F401
    from app.models import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind)


