import random
import string
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging_config import security_logger
from app.core.security import get_password_hash, verify_password
from app.models.password_reset import PasswordResetCode
from app.models.user import User
from app.shared.email_service import email_service


def generate_reset_code() -> str:
    """Generate a 6-digit numeric code"""
    return "".join(random.choices(string.digits, k=6))


def request_password_reset(db: Session, email: str) -> bool:
    """
    Request a password reset for the given email.
    Sends a 6-digit code to the user's email.
    Returns True if email was sent (or would be sent - we don't reveal if user exists)
    """
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Don't reveal if user exists - just return True as if email was sent
        security_logger.warning(f"Password reset requested for non-existent email: {email}")
        return True

    if not user.hashed_password:
        # OAuth-only user - can't reset password
        security_logger.warning(f"Password reset requested for OAuth-only user: {email}")
        return True

    # Invalidate any existing codes for this user
    db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id, PasswordResetCode.is_used.is_(False)
    ).update({"is_used": True})

    # Generate new code
    code = generate_reset_code()
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    reset_code = PasswordResetCode(user_id=user.id, code=code, expires_at=expires_at)
    db.add(reset_code)
    db.commit()

    # Send email with code
    success = email_service.send_password_reset_code(
        to_email=user.email, username=user.username or user.email, code=code, expires_minutes=15
    )

    if success:
        security_logger.info(f"Password reset code sent to: {email}")
    else:
        security_logger.error(f"Failed to send password reset code to: {email}")

    return success


def verify_reset_code(db: Session, email: str, code: str) -> Optional[PasswordResetCode]:
    """
    Verify a password reset code.
    Returns the reset code record if valid, None otherwise.
    """
    user = db.query(User).filter(User.email == email).first()

    if not user:
        security_logger.warning(f"Code verification attempted for non-existent email: {email}")
        return None

    reset_code = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id, PasswordResetCode.code == code, PasswordResetCode.is_used.is_(False)
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )

    if not reset_code:
        security_logger.warning(f"Invalid reset code attempted for: {email}")
        return None

    if reset_code.is_expired:
        security_logger.warning(f"Expired reset code used for: {email}")
        return None

    security_logger.info(f"Valid reset code verified for: {email}")
    return reset_code


def reset_password(db: Session, email: str, code: str, new_password: str) -> bool:
    """
    Reset the user's password using a valid code.
    """
    reset_code = verify_reset_code(db, email, code)

    if not reset_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code")

    user = db.query(User).filter(User.id == reset_code.user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Update password
    user.hashed_password = get_password_hash(new_password)

    # Mark code as used
    reset_code.is_used = True

    db.commit()

    security_logger.info(f"Password reset successful for: {email}")
    return True


def change_password(db: Session, user: User, current_password: str, new_password: str) -> bool:
    """
    Change password for authenticated user (requires current password).
    """
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change password for OAuth-only accounts"
        )

    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.hashed_password = get_password_hash(new_password)
    db.commit()

    security_logger.info(f"Password changed for user: {user.email}")
    return True
