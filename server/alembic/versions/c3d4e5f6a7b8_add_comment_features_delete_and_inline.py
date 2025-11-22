"""Add comment features - delete and inline

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2025-11-22 17:35:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pr_comments", sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("pr_comments", sa.Column("file_path", sa.String(length=500), nullable=True))
    op.add_column("pr_comments", sa.Column("line_number", sa.Integer(), nullable=True))
    op.add_column("pr_comments", sa.Column("line_end", sa.Integer(), nullable=True))

    op.alter_column("pr_comments", "is_deleted", server_default=None)


def downgrade() -> None:
    op.drop_column("pr_comments", "line_end")
    op.drop_column("pr_comments", "line_number")
    op.drop_column("pr_comments", "file_path")
    op.drop_column("pr_comments", "is_deleted")
