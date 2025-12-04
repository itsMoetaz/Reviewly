import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.config.settings import settings
from app.core.logging_config import security_logger

# Configure Cloudinary
if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


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
    Uses Cloudinary if configured, otherwise local storage.

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

    # Use Cloudinary if configured
    if settings.CLOUDINARY_CLOUD_NAME:
        try:
            # Reset file position for reading
            await file.seek(0)

            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                content,
                folder="reviewly/avatars",
                public_id=f"avatar_{user_id}_{uuid.uuid4().hex[:8]}",
                overwrite=True,
                transformation=[
                    {"width": 200, "height": 200, "crop": "fill", "gravity": "face"},
                    {"quality": "auto", "fetch_format": "auto"},
                ],
            )
            security_logger.info(f"Avatar uploaded to Cloudinary for user {user_id}")
            return result["secure_url"]
        except Exception as e:
            security_logger.error(f"Cloudinary upload failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload avatar",
            )

    # Fallback to local storage
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"

    upload_dir = get_upload_dir()
    file_path = upload_dir / unique_filename

    with open(file_path, "wb") as f:
        f.write(content)

    return f"/uploads/avatars/{unique_filename}"


def delete_avatar(avatar_url: str) -> None:
    """Delete an avatar file if it exists."""
    if not avatar_url:
        return

    # If it's a Cloudinary URL, delete from Cloudinary
    if "cloudinary.com" in avatar_url:
        try:
            # Extract public_id from URL
            # URL format: https://res.cloudinary.com/{cloud}/image/upload/v123/reviewly/avatars/avatar_1_abc123.jpg
            parts = avatar_url.split("/")
            # Get everything after 'upload/vXXX/' or 'upload/'
            upload_idx = parts.index("upload")
            # Skip version if present (starts with 'v' followed by numbers)
            start_idx = upload_idx + 1
            if parts[start_idx].startswith("v") and parts[start_idx][1:].isdigit():
                start_idx += 1
            public_id = "/".join(parts[start_idx:]).rsplit(".", 1)[0]

            cloudinary.uploader.destroy(public_id)
            security_logger.info(f"Deleted avatar from Cloudinary: {public_id}")
        except Exception as e:
            security_logger.warning(f"Failed to delete Cloudinary avatar: {e}")
        return

    # Local file deletion
    if not avatar_url.startswith("/uploads/avatars/"):
        return

    filename = avatar_url.split("/")[-1]
    file_path = get_upload_dir() / filename

    if file_path.exists():
        import os

        os.remove(file_path)
