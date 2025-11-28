from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services import upload_service, user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update current authenticated user's profile.

    Can update: email, username, full_name, password, avatar_url
    """
    return user_service.update_user(db, current_user, user_update)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Upload a new avatar image.

    - Max size: 2MB
    - Allowed types: JPEG, PNG, GIF, WebP
    """
    # Delete old avatar if exists
    if current_user.avatar_url:
        upload_service.delete_avatar(current_user.avatar_url)

    # Save new avatar
    avatar_url = await upload_service.save_avatar(file, current_user.id)

    # Update user
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me/avatar", response_model=UserResponse)
def delete_avatar(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete current user's avatar.
    """
    if current_user.avatar_url:
        upload_service.delete_avatar(current_user.avatar_url)
        current_user.avatar_url = None
        db.commit()
        db.refresh(current_user)

    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete current authenticated user's account.

    Warning: This action is irreversible!
    """
    user_service.delete_user(db, current_user)
    return None
