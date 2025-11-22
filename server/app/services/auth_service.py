from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.core.exceptions import UserAlreadyExistsException
from app.core.logging_config import security_logger
from app.core.security import get_password_hash, verify_password
from app.models import User, UserRole
from app.schemas import UserCreate


def create_user(db: Session, user_data: UserCreate) -> User:
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise UserAlreadyExistsException("Email already registered")

    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise UserAlreadyExistsException("Username already taken")

    hashed_password = get_password_hash(user_data.password)

    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=UserRole.USER,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    if "@" in identifier:
        existing_user = db.query(User).filter(User.email == identifier).first()
    else:
        existing_user = db.query(User).filter(User.username == identifier).first()

    if not existing_user:
        security_logger.warning(f"Failed login attempt - user not found: {identifier} at {datetime.now()}")
        return None

    if not verify_password(password, existing_user.hashed_password):
        security_logger.warning(f"Failed login attempt - wrong password for: {identifier} at {datetime.now()}")
        return None

    security_logger.info(f"Successful authentication for user: {identifier} at {datetime.now()}")
    return existing_user
