from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator

from app.models.project import PlatformType


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    platform: PlatformType
    repository_url: str


class ProjectCreateGitHub(ProjectBase):
    platform: PlatformType = PlatformType.GITHUB
    github_token: str
    github_repo_owner: str
    github_repo_name: str

    @validator("platform")
    def validate_platform(cls, v):
        if v != PlatformType.GITHUB:
            raise ValueError("Platform must be github")
        return v

    @validator("repository_url")
    def validate_github_url(cls, v):
        if not v.startswith("https://github.com/"):
            raise ValueError("Repository URL must be a valid GitHub URL (https://github.com/...)")
        return v


class ProjectCreateGitLab(ProjectBase):
    platform: PlatformType = PlatformType.GITLAB
    gitlab_project_id: str
    gitlab_token: str

    @validator("platform")
    def validate_platform(cls, v):
        if v != PlatformType.GITLAB:
            raise ValueError("Platform must be gitlab")
        return v

    @validator("repository_url")
    def validate_gitlab_url(cls, v):
        if not v.startswith("https://gitlab.com/"):
            raise ValueError("Repository URL must be a valid GitLab URL (https://gitlab.com/...)")
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    repository_url: Optional[str] = None
    github_token: Optional[str] = None
    gitlab_token: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    github_repo_owner: Optional[str] = None
    github_repo_name: Optional[str] = None
    gitlab_project_id: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectResponseWithoutTokens(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    platform: PlatformType
    repository_url: str
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectStats(BaseModel):
    branches_count: int = 0
    open_prs_count: int = 0
    closed_prs_count: int = 0
    total_prs_count: int = 0
    last_activity: Optional[datetime] = None


class ProjectResponseWithStats(ProjectResponse):
    stats: ProjectStats


class ProjectListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int
    projects: List[ProjectResponse]
