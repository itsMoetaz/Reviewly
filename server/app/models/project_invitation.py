import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base


class ProjectInvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class ProjectInvitationRole(str, enum.Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"


class ProjectInvitation(Base):

    __tablename__ = "project_invitations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    role = Column(Enum(ProjectInvitationRole), default=ProjectInvitationRole.REVIEWER, nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(Enum(ProjectInvitationStatus), default=ProjectInvitationStatus.PENDING, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="invitations")
    inviter = relationship("User")

    def __repr__(self):
        return f"<ProjectInvitation email={self.email} project={self.project_id} status={self.status}>"
