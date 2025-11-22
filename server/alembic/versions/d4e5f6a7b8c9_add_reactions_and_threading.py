"""Add reactions and threading

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2025-11-22 20:58:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comment_reactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("comment_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("reaction_type", sa.String(length=20), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["comment_id"], ["pr_comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("comment_id", "user_id", "reaction_type", name="uq_comment_user_reaction"),
    )
    op.create_index("ix_comment_reactions_comment", "comment_reactions", ["comment_id"], unique=False)
    op.create_index(op.f("ix_comment_reactions_id"), "comment_reactions", ["id"], unique=False)

    op.add_column("pr_comments", sa.Column("parent_comment_id", sa.Integer(), nullable=True))
    op.add_column("pr_comments", sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("pr_comments", sa.Column("resolved_by", sa.Integer(), nullable=True))
    op.add_column("pr_comments", sa.Column("resolved_at", postgresql.TIMESTAMP(timezone=True), nullable=True))

    op.create_foreign_key("fk_pr_comments_parent", "pr_comments", "pr_comments", ["parent_comment_id"], ["id"])
    op.create_foreign_key("fk_pr_comments_resolver", "pr_comments", "users", ["resolved_by"], ["id"])

    op.alter_column("pr_comments", "is_resolved", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_pr_comments_resolver", "pr_comments", type_="foreignkey")
    op.drop_constraint("fk_pr_comments_parent", "pr_comments", type_="foreignkey")

    op.drop_column("pr_comments", "resolved_at")
    op.drop_column("pr_comments", "resolved_by")
    op.drop_column("pr_comments", "is_resolved")
    op.drop_column("pr_comments", "parent_comment_id")

    op.drop_index(op.f("ix_comment_reactions_id"), table_name="comment_reactions")
    op.drop_index("ix_comment_reactions_comment", table_name="comment_reactions")
    op.drop_table("comment_reactions")
