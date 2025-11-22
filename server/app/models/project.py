import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base


class PlatformType(str, enum.Enum):
    GITHUB = "github"
    GITLAB = "gitlab"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    platform = Column(Enum(PlatformType), nullable=False)
    repository_url = Column(String, nullable=False)
    github_token = Column(String, nullable=True)
    github_repo_owner = Column(String, nullable=True)
    github_repo_name = Column(String, nullable=True)
    gitlab_project_id = Column(String, nullable=True)
    gitlab_token = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="projects")
    ai_reviews = relationship("AIReview", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name} ({self.platform.value})>"
