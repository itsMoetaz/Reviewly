"""Fix enum case

Revision ID: f2a3b4c5d6e7
Revises: f1a2b3c4d5e6
Create Date: 2025-11-23

"""

from alembic import op

# revision identifiers
revision = "f2a3b4c5d6e7"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade():
    # Fix project_members table
    op.execute("ALTER TABLE project_members ALTER COLUMN role TYPE VARCHAR USING role::text;")
    op.execute(
        """
        UPDATE project_members
        SET role = UPPER(role);
    """
    )

    # Fix project_invitations table - role column
    op.execute("ALTER TABLE project_invitations ALTER COLUMN role TYPE VARCHAR USING role::text;")
    op.execute(
        """
        UPDATE project_invitations
        SET role = UPPER(role);
    """
    )

    # Fix project_invitations table - status column
    op.execute("ALTER TABLE project_invitations ALTER COLUMN status TYPE VARCHAR USING status::text;")
    op.execute(
        """
        UPDATE project_invitations
        SET status = UPPER(status);
    """
    )

    # Drop old enum types
    op.execute("DROP TYPE IF EXISTS projectmemberrole CASCADE;")
    op.execute("DROP TYPE IF EXISTS projectinvitationrole CASCADE;")
    op.execute("DROP TYPE IF EXISTS projectinvitationstatus CASCADE;")


def downgrade():
    # No downgrade needed - enum case fix is permanent
    pass
