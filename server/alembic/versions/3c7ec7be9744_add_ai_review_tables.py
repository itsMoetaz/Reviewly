"""Add AI review tables

Revision ID: 3c7ec7be9744
Revises: 1db34f952c0e
Create Date: 2025-11-21 15:28:15.266947

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3c7ec7be9744"
down_revision: Union[str, None] = "1db34f952c0e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create reviewstatus enum
    op.execute("CREATE TYPE reviewstatus AS ENUM ('pending', 'processing', 'completed', 'failed')")

    # Create issueseverity enum
    op.execute("CREATE TYPE issueseverity AS ENUM ('critical', 'high', 'medium', 'low', 'info')")

    # Create ai_reviews table
    op.create_table(
        "ai_reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("pr_number", sa.Integer(), nullable=False),
        sa.Column(
            "status", sa.Enum("pending", "processing", "completed", "failed", name="reviewstatus"), nullable=False
        ),
        sa.Column("overall_rating", sa.String(length=50), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("files_analyzed", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("issues_found", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("ai_model", sa.String(length=100), nullable=False, server_default="llama-3.1-70b-versatile"),
        sa.Column("tokens_used", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("processing_time_seconds", sa.Integer(), nullable=True),
        sa.Column("api_key_used", sa.Integer(), nullable=True),
        sa.Column("requested_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for ai_reviews
    op.create_index("ix_ai_reviews_id", "ai_reviews", ["id"])
    op.create_index("idx_ai_reviews_status", "ai_reviews", ["status"])
    op.create_index("idx_ai_reviews_project_pr", "ai_reviews", ["project_id", "pr_number"])
    op.create_index("idx_ai_reviews_user", "ai_reviews", ["requested_by"])

    # Create review_issues table
    op.create_table(
        "review_issues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("line_number", sa.Integer(), nullable=True),
        sa.Column("line_end", sa.Integer(), nullable=True),
        sa.Column(
            "severity", sa.Enum("critical", "high", "medium", "low", "info", name="issueseverity"), nullable=False
        ),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("suggestion", sa.Text(), nullable=True),
        sa.Column("code_snippet", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["review_id"], ["ai_reviews.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for review_issues
    op.create_index("ix_review_issues_id", "review_issues", ["id"])
    op.create_index("idx_review_issues_review", "review_issues", ["review_id"])
    op.create_index("idx_review_issues_severity", "review_issues", ["severity"])


def downgrade() -> None:
    # Drop tables
    op.drop_index("idx_review_issues_severity", "review_issues")
    op.drop_index("idx_review_issues_review", "review_issues")
    op.drop_index("ix_review_issues_id", "review_issues")
    op.drop_table("review_issues")

    op.drop_index("idx_ai_reviews_user", "ai_reviews")
    op.drop_index("idx_ai_reviews_project_pr", "ai_reviews")
    op.drop_index("idx_ai_reviews_status", "ai_reviews")
    op.drop_index("ix_ai_reviews_id", "ai_reviews")
    op.drop_table("ai_reviews")

    # Drop enums
    op.execute("DROP TYPE issueseverity")
    op.execute("DROP TYPE reviewstatus")
