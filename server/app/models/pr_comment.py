from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.config.database import Base


class PRComment(Base):

    __tablename__ = "pr_comments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    pr_number = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    comment_text = Column(Text, nullable=False)

    github_comment_id = Column(BigInteger, nullable=True)
    gitlab_note_id = Column(BigInteger, nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False)
    file_path = Column(String(500), nullable=True)
    line_number = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="pr_comments")
    user = relationship("User", back_populates="pr_comments")

    def __repr__(self):
        return f"<PRComment {self.id} on PR#{self.pr_number}>"
