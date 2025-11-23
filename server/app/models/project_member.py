import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base


class ProjectMemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    REVIEWER = "reviewer"


class ProjectMember(Base):

    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum(ProjectMemberRole), nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="members")
    user = relationship("User", foreign_keys=[user_id], back_populates="project_memberships")
    inviter = relationship("User", foreign_keys=[invited_by])

    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_project_user"),)

    def __repr__(self):
        return f"<ProjectMember project={self.project_id} user={self.user_id} role={self.role}>"
