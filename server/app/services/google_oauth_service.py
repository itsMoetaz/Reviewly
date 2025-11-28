from typing import Dict

from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.core.logging_config import security_logger
from app.models.user import SubscriptionTier, User, UserRole


def get_google_auth_url() -> str:
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
            }
        },
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
    )

    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    security_logger.info("Generated Google OAuth authorization URL")
    return authorization_url


def exchange_code_for_token(code: str) -> Dict:
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
            }
        },
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
    )

    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

    flow.fetch_token(code=code)

    credentials = flow.credentials

    security_logger.info("Successfully exchanged authorization code for token")

    return {
        "token": credentials.token,
        "id_token": credentials.id_token,
    }


def get_google_user_info(id_token_str: str) -> Dict:
    try:
        user_info = id_token.verify_oauth2_token(id_token_str, requests.Request(), settings.GOOGLE_CLIENT_ID)

        security_logger.info(f"Retrieved Google user info for: {user_info.get('email')}")

        return {
            "google_id": user_info.get("sub"),
            "email": user_info.get("email"),
            "email_verified": user_info.get("email_verified", False),
            "full_name": user_info.get("name"),
            "given_name": user_info.get("given_name"),
            "family_name": user_info.get("family_name"),
            "picture": user_info.get("picture"),
        }
    except Exception as e:
        security_logger.error(f"Failed to verify Google ID token: {e}")
        raise ValueError(f"Invalid ID token: {str(e)}")


def get_or_create_user_from_google(db: Session, google_user_info: Dict) -> User:
    google_id = google_user_info.get("google_id")
    email = google_user_info.get("email")

    user = db.query(User).filter(User.google_id == google_id).first()

    if user:
        security_logger.info(f"Found existing user by google_id: {user.email}")
        return user

    user = db.query(User).filter(User.email == email).first()

    if user:
        user.google_id = google_id
        if not user.avatar_url and google_user_info.get("picture"):
            user.avatar_url = google_user_info.get("picture")
        db.commit()
        db.refresh(user)
        security_logger.info(f"Linked Google account to existing user: {user.email}")
        return user

    base_username = email.split("@")[0] if email else f"user_{google_id[:8]}"
    username = base_username
    counter = 1

    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1

    new_user = User(
        email=email,
        username=username,
        full_name=google_user_info.get("full_name"),
        google_id=google_id,
        hashed_password=None,
        avatar_url=google_user_info.get("picture"),
        role=UserRole.USER,
        is_active=True,
        subscription_tier=SubscriptionTier.FREE,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    security_logger.info(f"Created new user from Google OAuth: {new_user.email}")

    return new_user
