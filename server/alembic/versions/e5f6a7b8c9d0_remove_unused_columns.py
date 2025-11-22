"""Remove unused threading and resolution columns

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2025-11-22 22:25:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("fk_pr_comments_resolver", "pr_comments", type_="foreignkey")
    op.drop_constraint("fk_pr_comments_parent", "pr_comments", type_="foreignkey")

    op.drop_column("pr_comments", "resolved_at")
    op.drop_column("pr_comments", "resolved_by")
    op.drop_column("pr_comments", "is_resolved")
    op.drop_column("pr_comments", "parent_comment_id")


def downgrade() -> None:
    op.add_column("pr_comments", sa.Column("parent_comment_id", sa.Integer(), nullable=True))
    op.add_column("pr_comments", sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("pr_comments", sa.Column("resolved_by", sa.Integer(), nullable=True))
    op.add_column("pr_comments", sa.Column("resolved_at", postgresql.TIMESTAMP(timezone=True), nullable=True))

    op.create_foreign_key("fk_pr_comments_parent", "pr_comments", "pr_comments", ["parent_comment_id"], ["id"])
    op.create_foreign_key("fk_pr_comments_resolver", "pr_comments", "users", ["resolved_by"], ["id"])

    op.alter_column("pr_comments", "is_resolved", server_default=None)
