import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config.settings import settings


def get_upload_dir() -> Path:
    """Get the upload directory path, create if doesn't exist."""
    upload_path = Path(settings.UPLOAD_DIR) / "avatars"
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def validate_avatar_file(file: UploadFile) -> None:
    """Validate the uploaded avatar file."""
    # Check content type
    if file.content_type not in settings.allowed_avatar_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_avatar_types_list)}",
        )


async def save_avatar(file: UploadFile, user_id: int) -> str:
    """
    Save avatar file and return the URL path.

    Args:
        file: The uploaded file
        user_id: The user's ID (used in filename for uniqueness)

    Returns:
        The URL path to access the avatar
    """
    validate_avatar_file(file)

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > settings.MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_AVATAR_SIZE // (1024 * 1024)}MB",
        )

    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"

    # Save file
    upload_dir = get_upload_dir()
    file_path = upload_dir / unique_filename

    with open(file_path, "wb") as f:
        f.write(content)

    # Return the URL path (relative to static files mount)
    return f"/uploads/avatars/{unique_filename}"


def delete_avatar(avatar_url: str) -> None:
    """Delete an avatar file if it exists."""
    if not avatar_url or not avatar_url.startswith("/uploads/avatars/"):
        return

    # Extract filename from URL
    filename = avatar_url.split("/")[-1]
    file_path = get_upload_dir() / filename

    if file_path.exists():
        os.remove(file_path)
