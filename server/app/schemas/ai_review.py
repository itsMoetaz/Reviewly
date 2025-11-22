from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ReviewStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class IssueSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


# Request schemas
class AIReviewCreate(BaseModel):
    include_context: bool = Field(default=True, description="Include full file contents for context")
    focus_areas: Optional[List[str]] = Field(default=None, description="Specific areas to focus on")


# Response schemas
class ReviewIssueResponse(BaseModel):
    id: int
    file_path: str
    line_number: Optional[int]
    line_end: Optional[int]
    severity: IssueSeverity
    category: str
    title: str
    description: str
    suggestion: Optional[str]
    code_snippet: Optional[str]

    class Config:
        from_attributes = True


class AIReviewResponse(BaseModel):
    id: int
    project_id: int
    pr_number: int
    status: ReviewStatus
    overall_rating: Optional[str]
    summary: Optional[str]
    files_analyzed: int
    issues_found: int
    ai_model: str
    tokens_used: int
    processing_time_seconds: Optional[int]
    requested_by: int
    created_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class AIReviewWithIssues(AIReviewResponse):
    issues: List[ReviewIssueResponse]
    project_name: str
    requester_username: str


class ReviewListResponse(BaseModel):
    reviews: List[AIReviewResponse]
    total: int
    page: int
    per_page: int
