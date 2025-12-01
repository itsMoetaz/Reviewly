"""add password reset codes table

Revision ID: j1k2l3m4n5o6
Revises: i4j5k6l7m8n9
Create Date: 2024-12-01 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "j1k2l3m4n5o6"
down_revision: Union[str, None] = "i4j5k6l7m8n9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_codes",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(6), nullable=False),
        sa.Column("is_used", sa.Boolean(), default=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_password_reset_codes_id", "password_reset_codes", ["id"])
    op.create_index("ix_password_reset_codes_user_id", "password_reset_codes", ["user_id"])
    op.create_index("ix_password_reset_codes_code", "password_reset_codes", ["code"])


def downgrade() -> None:
    op.drop_index("ix_password_reset_codes_code", table_name="password_reset_codes")
    op.drop_index("ix_password_reset_codes_user_id", table_name="password_reset_codes")
    op.drop_index("ix_password_reset_codes_id", table_name="password_reset_codes")
    op.drop_table("password_reset_codes")
