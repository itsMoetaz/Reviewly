from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.team import (
    AcceptInvitationRequest,
    InviteMemberRequest,
    ProjectInvitationResponse,
    ProjectMemberResponse,
    UpdateMemberRoleRequest,
)
from app.services import team_service

router = APIRouter(prefix="/projects", tags=["team"])


@router.post(
    "/{project_id}/members/invite", response_model=ProjectInvitationResponse, status_code=status.HTTP_201_CREATED
)
def invite_member(
    project_id: int,
    invite_data: InviteMemberRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Invite a user to join the project (Admin+ only)"""
    invitation = team_service.invite_member(
        db=db, project_id=project_id, email=invite_data.email, role=invite_data.role, inviter_id=current_user.id
    )
    return invitation


@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
def get_members(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all members of the project"""
    members = team_service.get_project_members(db=db, project_id=project_id, user_id=current_user.id)
    return members


@router.patch("/{project_id}/members/{member_user_id}", response_model=ProjectMemberResponse)
def update_member_role(
    project_id: int,
    member_user_id: int,
    role_data: UpdateMemberRoleRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a member's role (Admin+ only)"""
    member = team_service.update_member_role(
        db=db,
        project_id=project_id,
        member_user_id=member_user_id,
        new_role=role_data.role,
        requester_id=current_user.id,
    )
    return member


@router.delete("/{project_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: int,
    member_user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Remove a member from the project (Admin+ only)"""
    team_service.remove_member(
        db=db, project_id=project_id, member_user_id=member_user_id, requester_id=current_user.id
    )
    return None


@router.get("/{project_id}/invitations", response_model=List[ProjectInvitationResponse])
def get_invitations(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get pending invitations for the project (Admin+ only)"""
    invitations = team_service.get_project_invitations(db=db, project_id=project_id, user_id=current_user.id)
    return invitations


@router.delete("/{project_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invitation(
    project_id: int,
    invitation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Cancel a pending invitation (Admin+ only)"""
    team_service.cancel_invitation(db=db, project_id=project_id, invitation_id=invitation_id, user_id=current_user.id)
    return None


@router.post("/invitations/accept", response_model=ProjectMemberResponse)
def accept_invitation(
    token_data: AcceptInvitationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Accept an invitation to join a project"""
    member = team_service.accept_invitation(db=db, token=token_data.token, user_id=current_user.id)
    return member


@router.post("/invitations/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_invitation(
    token_data: AcceptInvitationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Decline an invitation to join a project"""
    team_service.decline_invitation(db=db, token=token_data.token, user_id=current_user.id)
    return None


@router.get("/invitations/my", response_model=List[ProjectInvitationResponse])
def get_my_invitations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all pending invitations for the current user's email"""
    invitations = team_service.get_user_invitations(db=db, email=current_user.email)
    return invitations
