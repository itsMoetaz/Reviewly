"""add google oauth support

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6
Create Date: 2025-11-27

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "h2i3j4k5l6m7"
down_revision: Union[str, None] = "g1h2i3j4k5l6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make hashed_password nullable for Google OAuth users
    op.alter_column("users", "hashed_password", existing_type=sa.String(), nullable=True)

    # Add google_id column for Google OAuth integration
    op.add_column("users", sa.Column("google_id", sa.String(), nullable=True))
    op.create_index(op.f("ix_users_google_id"), "users", ["google_id"], unique=True)


def downgrade() -> None:
    # Remove google_id column
    op.drop_index(op.f("ix_users_google_id"), table_name="users")
    op.drop_column("users", "google_id")

    # Make hashed_password non-nullable again
    op.alter_column("users", "hashed_password", existing_type=sa.String(), nullable=False)
