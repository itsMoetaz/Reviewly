from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PRCommentCreate(BaseModel):

    comment_text: str = Field(..., min_length=1, max_length=65000, description="The comment text to post")


class PRCommentResponse(BaseModel):

    id: int
    project_id: int
    pr_number: int
    user_id: int
    comment_text: str
    github_comment_id: Optional[int] = None
    gitlab_note_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
