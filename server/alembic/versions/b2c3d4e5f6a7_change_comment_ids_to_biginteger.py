"""Change comment IDs to BigInteger

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2025-11-22 16:02:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("pr_comments", "github_comment_id", type_=sa.BigInteger())
    op.alter_column("pr_comments", "gitlab_note_id", type_=sa.BigInteger())


def downgrade() -> None:
    op.alter_column("pr_comments", "github_comment_id", type_=sa.Integer())
    op.alter_column("pr_comments", "gitlab_note_id", type_=sa.Integer())
