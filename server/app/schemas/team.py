from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.project_invitation import ProjectInvitationRole, ProjectInvitationStatus
from app.models.project_member import ProjectMemberRole


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: ProjectInvitationRole


class UpdateMemberRoleRequest(BaseModel):
    role: ProjectMemberRole


class ProjectMemberUser(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectMemberResponse(BaseModel):
    id: int
    user_id: int
    project_id: int
    role: ProjectMemberRole
    joined_at: datetime
    user: Optional[ProjectMemberUser] = None

    class Config:
        from_attributes = True


class ProjectInvitationResponse(BaseModel):
    id: int
    email: str
    role: ProjectInvitationRole
    status: ProjectInvitationStatus
    invited_by: int
    expires_at: datetime
    created_at: datetime
    responded_at: Optional[datetime] = None
    project_id: Optional[int] = None
    token: Optional[str] = None
    project_name: Optional[str] = None
    inviter_name: Optional[str] = None

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    token: str
