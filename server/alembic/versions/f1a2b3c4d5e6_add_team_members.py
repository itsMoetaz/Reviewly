"""Add team members and invitations

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2025-11-23 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "project_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "role",
            sa.Enum("owner", "admin", "reviewer", name="projectmemberrole", create_type=False),
            nullable=False,
        ),
        sa.Column("invited_by", sa.Integer(), nullable=True),
        sa.Column("joined_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["invited_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "user_id", name="uq_project_user"),
    )
    op.create_index(op.f("ix_project_members_id"), "project_members", ["id"], unique=False)
    op.create_index(op.f("ix_project_members_project_id"), "project_members", ["project_id"], unique=False)
    op.create_index(op.f("ix_project_members_user_id"), "project_members", ["user_id"], unique=False)

    op.create_table(
        "project_invitations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "reviewer", name="projectinvitationrole", create_type=False),
            nullable=False,
        ),
        sa.Column("invited_by", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=100), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "accepted", "declined", "expired", name="projectinvitationstatus", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("responded_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["invited_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token", name="uq_invitation_token"),
    )
    op.create_index(op.f("ix_project_invitations_email"), "project_invitations", ["email"], unique=False)
    op.create_index(op.f("ix_project_invitations_id"), "project_invitations", ["id"], unique=False)
    op.create_index(op.f("ix_project_invitations_project_id"), "project_invitations", ["project_id"], unique=False)
    op.create_index(op.f("ix_project_invitations_token"), "project_invitations", ["token"], unique=True)

    op.execute(
        """
        INSERT INTO project_members (project_id, user_id, role, joined_at, created_at)
        SELECT id, user_id, 'owner', created_at, created_at
        FROM projects
    """
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_project_invitations_token"), table_name="project_invitations")
    op.drop_index(op.f("ix_project_invitations_project_id"), table_name="project_invitations")
    op.drop_index(op.f("ix_project_invitations_id"), table_name="project_invitations")
    op.drop_index(op.f("ix_project_invitations_email"), table_name="project_invitations")
    op.drop_table("project_invitations")

    op.drop_index(op.f("ix_project_members_user_id"), table_name="project_members")
    op.drop_index(op.f("ix_project_members_project_id"), table_name="project_members")
    op.drop_index(op.f("ix_project_members_id"), table_name="project_members")
    op.drop_table("project_members")
