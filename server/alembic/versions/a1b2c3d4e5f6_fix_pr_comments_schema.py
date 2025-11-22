"""Fix pr_comments schema

Revision ID: a1b2c3d4e5f6
Revises: f024c50813ac
Create Date: 2025-11-22 16:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f024c50813ac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pr_comments", sa.Column("pr_number", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("pr_comments", sa.Column("comment_text", sa.Text(), nullable=True))
    op.add_column("pr_comments", sa.Column("github_comment_id", sa.Integer(), nullable=True))
    op.add_column("pr_comments", sa.Column("gitlab_note_id", sa.Integer(), nullable=True))
    op.add_column(
        "pr_comments",
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
    )

    op.execute("UPDATE pr_comments SET comment_text = comment WHERE comment_text IS NULL")

    op.alter_column("pr_comments", "comment_text", nullable=False)
    op.alter_column("pr_comments", "pr_number", server_default=None)

    op.create_index("ix_pr_comments_pr_number", "pr_comments", ["pr_number"], unique=False)

    op.drop_column("pr_comments", "comment")
    op.drop_column("pr_comments", "file_path")
    op.drop_column("pr_comments", "line_number")
    op.drop_column("pr_comments", "line_end")


def downgrade() -> None:
    op.add_column("pr_comments", sa.Column("line_end", sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column("pr_comments", sa.Column("line_number", sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column("pr_comments", sa.Column("file_path", sa.VARCHAR(length=500), autoincrement=False, nullable=True))
    op.add_column("pr_comments", sa.Column("comment", sa.TEXT(), autoincrement=False, nullable=False))

    op.drop_index("ix_pr_comments_pr_number", table_name="pr_comments")

    op.drop_column("pr_comments", "updated_at")
    op.drop_column("pr_comments", "gitlab_note_id")
    op.drop_column("pr_comments", "github_comment_id")
    op.drop_column("pr_comments", "comment_text")
    op.drop_column("pr_comments", "pr_number")
