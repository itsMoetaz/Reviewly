from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.config.database import Base


class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class IssueSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AIReview(Base):
    __tablename__ = "ai_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    pr_number = Column(Integer, nullable=False)
    status = Column(
        Enum(ReviewStatus, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ReviewStatus.PENDING
    )
    overall_rating = Column(String(50), nullable=True)
    summary = Column(Text, nullable=True)
    files_analyzed = Column(Integer, default=0)
    issues_found = Column(Integer, default=0)
    ai_model = Column(String(100), nullable=False, default="llama-3.3-70b-versatile")
    tokens_used = Column(Integer, default=0)
    processing_time_seconds = Column(Integer, nullable=True)
    api_key_used = Column(Integer, nullable=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="ai_reviews")
    requester = relationship("User", back_populates="ai_reviews")
    issues = relationship("ReviewIssue", back_populates="review", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AIReview {self.id} PR#{self.pr_number} {self.status.value}>"


class ReviewIssue(Base):
    __tablename__ = "review_issues"
    
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("ai_reviews.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    line_number = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    severity = Column(
        Enum(IssueSeverity, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False
    )
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=True)
    code_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    review = relationship("AIReview", back_populates="issues")
    
    def __repr__(self):
        return f"<ReviewIssue {self.id} {self.severity.value} {self.category}>"
