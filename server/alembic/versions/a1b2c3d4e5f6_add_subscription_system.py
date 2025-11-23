"""Add subscription system

Revision ID: a1b2c3d4e5f6
Revises: f2a3b4c5d6e7
Create Date: 2025-11-23

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers
revision = "b2c3d4e5f6g7"  # Changed from a1b2c3d4e5f6 to avoid conflict
down_revision = "f2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade():
    # Add subscription fields to users table - using VARCHAR to avoid PostgreSQL enum issues
    op.add_column("users", sa.Column("subscription_tier", sa.String(20), server_default="free", nullable=False))
    op.add_column("users", sa.Column("subscription_updated_at", sa.DateTime(), nullable=True))

    # Create usage_tracking table
    op.create_table(
        "usage_tracking",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("ai_reviews_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "year", "month", name="uq_user_month"),
    )

    # Create index for fast lookups
    op.create_index("idx_usage_user_month", "usage_tracking", ["user_id", "year", "month"])


def downgrade():
    # Drop index
    op.drop_index("idx_usage_user_month", "usage_tracking")

    # Drop usage_tracking table
    op.drop_table("usage_tracking")

    # Remove subscription columns from users
    op.drop_column("users", "subscription_updated_at")
    op.drop_column("users", "subscription_tier")
