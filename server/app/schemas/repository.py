from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.project import PlatformType

# ==================== Branch Schemas ====================


class BranchCommit(BaseModel):
    sha: str
    message: Optional[str] = None
    author: Optional[str] = None
    date: Optional[datetime] = None


class Branch(BaseModel):
    name: str
    commit: BranchCommit
    protected: bool = False


class BranchListResponse(BaseModel):
    project_id: int
    platform: PlatformType
    branches: List[Branch]


# ==================== Pull Request / Merge Request Schemas ====================


class PullRequestAuthor(BaseModel):
    username: str
    avatar_url: Optional[str] = None


class PullRequestSummary(BaseModel):
    number: int
    title: str
    state: str
    author: str
    author_avatar: Optional[str] = None
    source_branch: str
    target_branch: str
    created_at: datetime
    updated_at: datetime
    comments_count: int = 0
    commits_count: Optional[int] = None
    changed_files_count: Optional[int] = None
    additions: Optional[int] = None
    deletions: Optional[int] = None
    upvotes: Optional[int] = None
    downvotes: Optional[int] = None
    work_in_progress: Optional[bool] = None


class PullRequestListResponse(BaseModel):
    project_id: int
    platform: PlatformType
    total: int
    page: int
    per_page: int
    pull_requests: List[PullRequestSummary]


# ==================== Pull Request Details Schemas ====================


class CommitInfo(BaseModel):
    sha: str
    message: str
    author: str
    date: datetime


class FileChange(BaseModel):
    filename: str
    status: str
    additions: int
    deletions: int
    changes: int
    patch: Optional[str] = None
    diff: Optional[str] = None
    previous_filename: Optional[str] = None
    previous_path: Optional[str] = None


class PullRequestStats(BaseModel):
    total_commits: int
    total_additions: int
    total_deletions: int
    total_changes: int
    changed_files: int


class PullRequestDetails(BaseModel):
    number: int
    title: str
    description: str
    state: str
    author: PullRequestAuthor
    source_branch: str
    target_branch: str
    created_at: datetime
    updated_at: datetime
    merged_at: Optional[datetime] = None
    mergeable: Optional[bool] = None
    work_in_progress: Optional[bool] = None
    commits: List[CommitInfo]
    files: List[FileChange]
    stats: PullRequestStats


class PullRequestDetailsResponse(BaseModel):
    project_id: int
    platform: PlatformType
    pull_request: PullRequestDetails


# ==================== File Content Schemas ====================


class FileContent(BaseModel):
    path: str
    name: str
    size: int
    sha: str
    encoding: str
    content: str
    branch: str
    download_url: Optional[str] = None


class FileContentResponse(BaseModel):
    project_id: int
    platform: PlatformType
    file: FileContent


# ==================== File Diff Schemas ====================


class FileDiff(BaseModel):
    path: str
    status: str
    additions: int
    deletions: int
    changes: int
    patch: Optional[str] = None
    diff: Optional[str] = None
    previous_filename: Optional[str] = None
    previous_path: Optional[str] = None


class FileDiffResponse(BaseModel):
    project_id: int
    pr_number: int
    platform: PlatformType
    file: FileDiff
