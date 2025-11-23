from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class PRCommentCreate(BaseModel):
    comment_text: str = Field(..., min_length=1, max_length=65000, description="The comment text to post")


class ReactionType(str, Enum):
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    HEART = "heart"
    ROCKET = "rocket"
    EYES = "eyes"
    PARTY = "party"


class ReactionCreate(BaseModel):
    reaction_type: ReactionType


class ReactionResponse(BaseModel):
    id: int
    comment_id: int
    user_id: int
    reaction_type: ReactionType
    created_at: datetime

    class Config:
        from_attributes = True


class ReactionsSummary(BaseModel):
    thumbs_up: int = 0
    thumbs_down: int = 0
    heart: int = 0
    rocket: int = 0
    eyes: int = 0
    party: int = 0
    user_reactions: List[ReactionType] = []


class PRCommentResponse(BaseModel):
    id: int
    project_id: int
    pr_number: int
    user_id: int
    comment_text: str
    github_comment_id: Optional[int] = None
    gitlab_note_id: Optional[int] = None
    is_deleted: bool
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    line_end: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    reactions_summary: Optional[ReactionsSummary] = None

    class Config:
        from_attributes = True


class PRCommentUpdate(BaseModel):
    comment_text: str = Field(..., min_length=1, max_length=65000)


class InlineCommentCreate(BaseModel):
    comment_text: str = Field(..., min_length=1, max_length=65000, description="The comment text")
    commit_sha: str = Field(..., min_length=40, max_length=40, description="Git commit SHA")
    file_path: str = Field(..., max_length=500, description="Path to file in repository")
    line_number: int = Field(..., gt=0, description="Line number in file")
    line_end: Optional[int] = Field(None, gt=0, description="End line for multi-line comments")
