"""Add pr_comments

Revision ID: f024c50813ac
Revises: 3c7ec7be9744
Create Date: 2025-11-22 15:19:35.047692

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f024c50813ac"
down_revision: Union[str, None] = "3c7ec7be9744"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create pr_comments table
    op.create_table(
        "pr_comments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer,
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("comment", sa.Text, nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column("line_number", sa.Integer, nullable=True),
        sa.Column("line_end", sa.Integer, nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )

    # Helpful indexes for queries
    op.create_index(
        "idx_pr_comments_project",
        "pr_comments",
        ["project_id"],
        unique=False,
    )
    op.create_index(
        "idx_pr_comments_user",
        "pr_comments",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    # Drop indexes then table (reverse of upgrade)
    op.drop_index("idx_pr_comments_user", table_name="pr_comments")
    op.drop_index("idx_pr_comments_project", table_name="pr_comments")
    op.drop_table("pr_comments")
