"""Add index to project user_id

Revision ID: i4j5k6l7m8n9
Revises: h2i3j4k5l6m7
Create Date: 2025-11-28

"""

from alembic import op

# revision identifiers
revision = "i4j5k6l7m8n9"
down_revision = "h2i3j4k5l6m7"
branch_labels = None
depends_on = None


def upgrade():
    # Add index to user_id in projects table for better query performance
    op.create_index("ix_projects_user_id", "projects", ["user_id"], unique=False)


def downgrade():
    # Remove the index
    op.drop_index("ix_projects_user_id", table_name="projects")
