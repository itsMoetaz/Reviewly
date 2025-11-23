"""Update existing users subscription tier to uppercase

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2025-11-23
"""

from alembic import op

revision = "c3d4e5f6g7h8"
down_revision = "b2c3d4e5f6g7"


def upgrade():
    # Update existing subscription_tier values to uppercase
    op.execute("UPDATE users SET subscription_tier = UPPER(subscription_tier);")


def downgrade():
    # Revert to lowercase
    op.execute("UPDATE users SET subscription_tier = LOWER(subscription_tier);")
