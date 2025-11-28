from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import UserAlreadyExistsException
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserUpdate


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get a user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get a user by username."""
    return db.query(User).filter(User.username == username).first()


def update_user(db: Session, user: User, user_update: UserUpdate) -> User:
    """
    Update user information.
    Only updates fields that are provided (not None).
    """
    update_data = user_update.model_dump(exclude_unset=True)

    # Check if email is being changed and if it's already taken
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = get_user_by_email(db, update_data["email"])
        if existing_user:
            raise UserAlreadyExistsException("Email already registered")

    # Check if username is being changed and if it's already taken
    if "username" in update_data and update_data["username"] != user.username:
        existing_user = get_user_by_username(db, update_data["username"])
        if existing_user:
            raise UserAlreadyExistsException("Username already taken")

    # Hash password if it's being updated
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    # Update user fields
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user: User) -> None:
    """Delete a user account."""
    db.delete(user)
    db.commit()
