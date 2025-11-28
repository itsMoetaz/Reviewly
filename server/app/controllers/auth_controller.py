from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.core.dependencies import get_current_active_user, get_db
from app.core.logging_config import security_logger
from app.core.security import create_access_token, create_refresh_token, decode_access_token
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse
from app.services import google_oauth_service
from app.services.auth_service import authenticate_user, create_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = create_user(db, user_data)
    return user


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form_data.username
    client_ip = request.client.host

    security_logger.info(f"Login attempt from IP: {client_ip} for email: {email}")

    user = authenticate_user(db, email, form_data.password)

    if user is None:
        security_logger.warning(f"Failed login from IP: {client_ip} for email: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        security_logger.warning(f"Inactive user login attempt from IP: {client_ip} for email: {email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    security_logger.info(f"Successful login from IP: {client_ip} for user: {email}")

    # Convert user.id to string for JWT spec compliance
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=settings.is_production,
        path="/auth",
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response):
    security_logger.info("User logged out successfully")
    response.delete_cookie("refresh_token", path="/auth")
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=Token, status_code=status.HTTP_200_OK)
def refresh_token(response: Response, refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(refresh_token)
        if payload is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        user_id = int(user_id_str)  # Convert back to int
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=settings.is_production,
        path="/auth",
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.get("/google/login")
def google_login(request: Request):
    try:
        authorization_url = google_oauth_service.get_google_auth_url()
        security_logger.info(f"Redirecting to Google OAuth from IP: {request.client.host}")
        return RedirectResponse(url=authorization_url)
    except Exception as e:
        security_logger.error(f"Failed to generate Google OAuth URL: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to initiate Google OAuth")


@router.get("/google/callback")
def google_callback(code: str, request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        client_ip = request.client.host
        security_logger.info(f"Google OAuth callback received from IP: {client_ip}")

        token_data = google_oauth_service.exchange_code_for_token(code)

        google_user_info = google_oauth_service.get_google_user_info(token_data["id_token"])

        user = google_oauth_service.get_or_create_user_from_google(db, google_user_info)

        if not user.is_active:
            security_logger.warning(f"Inactive user OAuth login attempt: {user.email}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is inactive")

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token_str = create_refresh_token(data={"sub": str(user.id)})

        response.set_cookie(
            key="refresh_token",
            value=refresh_token_str,
            httponly=True,
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            secure=settings.is_production,
            path="/auth",
        )

        security_logger.info(f"Successful Google OAuth login for user: {user.email}")

        frontend_redirect = f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        return RedirectResponse(url=frontend_redirect)

    except ValueError as e:
        security_logger.error(f"Google OAuth validation error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.error(f"Google OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to complete Google OAuth login"
        )
