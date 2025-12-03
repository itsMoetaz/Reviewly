"""add composite indexes for performance

Revision ID: z1a2b3c4d5e6
Revises: k1l2m3n4o5p6
Create Date: 2025-01-21 12:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "z1a2b3c4d5e6"
down_revision = "k1l2m3n4o5p6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add composite index for ai_reviews (project_id, pr_number)
    op.create_index("ix_ai_reviews_project_pr", "ai_reviews", ["project_id", "pr_number"], unique=False)

    # Add composite index for pr_comments (project_id, pr_number)
    op.create_index("ix_pr_comments_project_pr", "pr_comments", ["project_id", "pr_number"], unique=False)

    # Add index for ai_reviews project_id (was missing)
    op.create_index("ix_ai_reviews_project_id", "ai_reviews", ["project_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_ai_reviews_project_id", table_name="ai_reviews")
    op.drop_index("ix_pr_comments_project_pr", table_name="pr_comments")
    op.drop_index("ix_ai_reviews_project_pr", table_name="ai_reviews")
