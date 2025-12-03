import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.logging_config import security_logger
from app.models.project_invitation import ProjectInvitation, ProjectInvitationRole, ProjectInvitationStatus
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.user import User
from app.services import project_service


def get_utc_now() -> datetime:
    """Get current UTC time as timezone-aware datetime"""
    return datetime.now(timezone.utc)


def get_user_role(db: Session, project_id: int, user_id: int) -> Optional[ProjectMemberRole]:
    """Get user's role in a project, returns None if not a member"""
    member = (
        db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id).first()
    )
    return member.role if member else None


def check_permission(db: Session, project_id: int, user_id: int, min_role: ProjectMemberRole) -> bool:
    """Check if user has sufficient permissions (role >= min_role)"""
    role = get_user_role(db, project_id, user_id)
    if not role:
        return False

    role_hierarchy = {ProjectMemberRole.REVIEWER: 1, ProjectMemberRole.ADMIN: 2, ProjectMemberRole.OWNER: 3}

    return role_hierarchy.get(role, 0) >= role_hierarchy.get(min_role, 0)


def require_permission(
    db: Session, project_id: int, user_id: int, min_role: ProjectMemberRole, action: str = "perform this action"
):
    """Raise exception if user doesn't have permission"""
    if not check_permission(db, project_id, user_id, min_role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Insufficient permissions to {action}")


def invite_member(
    db: Session, project_id: int, email: str, role: ProjectInvitationRole, inviter_id: int
) -> ProjectInvitation:
    """Invite a user to join the project"""

    require_permission(db, project_id, inviter_id, ProjectMemberRole.ADMIN, "invite members")

    project = project_service.get_project_by_id(db, project_id, user_id=inviter_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    invited_user = db.query(User).filter(User.email == email).first()
    if invited_user:
        existing_member = (
            db.query(ProjectMember)
            .filter(ProjectMember.project_id == project_id, ProjectMember.user_id == invited_user.id)
            .first()
        )
        if existing_member:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")

    pending_invitation = (
        db.query(ProjectInvitation)
        .filter(
            ProjectInvitation.project_id == project_id,
            ProjectInvitation.email == email,
            ProjectInvitation.status == ProjectInvitationStatus.PENDING,
        )
        .first()
    )
    if pending_invitation:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invitation already sent")

    token = secrets.token_urlsafe(32)
    expires_at = get_utc_now() + timedelta(days=7)

    invitation = ProjectInvitation(
        project_id=project_id,
        email=email,
        role=role,
        invited_by=inviter_id,
        token=token,
        expires_at=expires_at,
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # Send invitation email
    try:
        from app.config.settings import settings
        from app.shared.email_service import email_service

        inviter = db.query(User).filter(User.id == inviter_id).first()

        email_service.send_team_invitation(
            to_email=email,
            inviter_name=inviter.username if inviter else "Team member",
            project_name=project.name,
            role=role.value,
            token=token,
            frontend_url=settings.FRONTEND_URL,
            expires_days=7,
        )

        security_logger.info(f"Invitation email sent to {email} for project {project_id}")
    except Exception as e:
        security_logger.error(f"Failed to send invitation email to {email}: {str(e)}")
        # Don't fail the invitation if email fails

    security_logger.info(f"User {inviter_id} invited {email} to project {project_id} as {role.value}")

    return invitation


def accept_invitation(db: Session, token: str, user_id: int) -> ProjectMember:
    """Accept an invitation to join a project"""

    invitation = db.query(ProjectInvitation).filter(ProjectInvitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    if invitation.status != ProjectInvitationStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already responded to")

    if invitation.expires_at < get_utc_now():
        invitation.status = ProjectInvitationStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation expired")

    user = db.query(User).filter(User.id == user_id).first()
    if user.email != invitation.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invitation is for a different email address")

    existing_member = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == invitation.project_id, ProjectMember.user_id == user_id)
        .first()
    )
    if existing_member:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already a member")

    member = ProjectMember(
        project_id=invitation.project_id,
        user_id=user_id,
        role=ProjectMemberRole.ADMIN if invitation.role == ProjectInvitationRole.ADMIN else ProjectMemberRole.REVIEWER,
        invited_by=invitation.invited_by,
    )

    db.add(member)

    invitation.status = ProjectInvitationStatus.ACCEPTED
    invitation.responded_at = get_utc_now()

    db.commit()
    db.refresh(member)

    security_logger.info(f"User {user_id} accepted invitation to project {invitation.project_id}")

    return member


def decline_invitation(db: Session, token: str, user_id: int) -> bool:
    """Decline an invitation"""

    invitation = db.query(ProjectInvitation).filter(ProjectInvitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    if invitation.status != ProjectInvitationStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already responded to")

    user = db.query(User).filter(User.id == user_id).first()
    if user.email != invitation.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invitation is for a different email address")

    invitation.status = ProjectInvitationStatus.DECLINED
    invitation.responded_at = get_utc_now()

    db.commit()

    security_logger.info(f"User {user_id} declined invitation to project {invitation.project_id}")

    return True


def get_project_members(db: Session, project_id: int, user_id: int) -> List[dict]:
    """Get all members of a project"""

    require_permission(db, project_id, user_id, ProjectMemberRole.REVIEWER, "view team members")

    # Use joinedload to avoid N+1 queries - fetch users in single query
    members = (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.project_id == project_id)
        .all()
    )

    result = []
    for member in members:
        user = member.user  # Already loaded via joinedload
        result.append(
            {
                "id": member.id,
                "user_id": member.user_id,
                "project_id": project_id,
                "role": member.role,
                "joined_at": member.joined_at,
                "user": (
                    {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "full_name": user.full_name or user.username,
                        "avatar_url": user.avatar_url,
                    }
                    if user
                    else None
                ),
            }
        )

    return result


def get_project_invitations(db: Session, project_id: int, user_id: int) -> List[ProjectInvitation]:
    """Get pending invitations for a project"""

    require_permission(db, project_id, user_id, ProjectMemberRole.ADMIN, "view invitations")

    invitations = (
        db.query(ProjectInvitation)
        .filter(ProjectInvitation.project_id == project_id, ProjectInvitation.status == ProjectInvitationStatus.PENDING)
        .all()
    )

    return invitations


def get_user_invitations(db: Session, email: str) -> List[dict]:
    """Get all pending invitations for a user's email"""
    # Use joinedload to avoid N+1 queries - fetch project and inviter in single query
    invitations = (
        db.query(ProjectInvitation)
        .options(joinedload(ProjectInvitation.project), joinedload(ProjectInvitation.inviter))
        .filter(
            ProjectInvitation.email == email,
            ProjectInvitation.status == ProjectInvitationStatus.PENDING,
        )
        .all()
    )

    result = []
    for inv in invitations:
        project = inv.project  # Already loaded via joinedload
        inviter = inv.inviter  # Already loaded via joinedload
        result.append(
            {
                "id": inv.id,
                "project_id": inv.project_id,
                "email": inv.email,
                "role": inv.role,
                "status": inv.status,
                "invited_by": inv.invited_by,
                "expires_at": inv.expires_at,
                "created_at": inv.created_at,
                "token": inv.token,
                "project_name": project.name if project else "Unknown Project",
                "inviter_name": inviter.username if inviter else "Unknown",
            }
        )

    return result


def update_member_role(
    db: Session, project_id: int, member_user_id: int, new_role: ProjectMemberRole, requester_id: int
) -> ProjectMember:
    """Update a member's role"""

    require_permission(db, project_id, requester_id, ProjectMemberRole.ADMIN, "update member roles")

    if requester_id == member_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own role")

    member = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id, ProjectMember.user_id == member_user_id)
        .first()
    )

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.role == ProjectMemberRole.OWNER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change owner's role")

    if new_role == ProjectMemberRole.OWNER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot assign owner role")

    member.role = new_role
    db.commit()
    db.refresh(member)

    security_logger.info(f"User {requester_id} updated user {member_user_id} role to {new_role.value}")

    return member


def remove_member(db: Session, project_id: int, member_user_id: int, requester_id: int) -> bool:
    """Remove a member from the project"""

    require_permission(db, project_id, requester_id, ProjectMemberRole.ADMIN, "remove members")

    if requester_id == member_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself")

    member = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project_id, ProjectMember.user_id == member_user_id)
        .first()
    )

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.role == ProjectMemberRole.OWNER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove project owner")

    db.delete(member)
    db.commit()

    security_logger.info(f"User {requester_id} removed user {member_user_id} from project {project_id}")

    return True


def cancel_invitation(db: Session, project_id: int, invitation_id: int, user_id: int) -> bool:
    """Cancel a pending invitation"""

    require_permission(db, project_id, user_id, ProjectMemberRole.ADMIN, "cancel invitations")

    invitation = (
        db.query(ProjectInvitation)
        .filter(ProjectInvitation.id == invitation_id, ProjectInvitation.project_id == project_id)
        .first()
    )

    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    db.delete(invitation)
    db.commit()

    security_logger.info(f"User {user_id} cancelled invitation {invitation_id}")

    return True
