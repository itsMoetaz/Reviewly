from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ---------- Database ----------
    DATABASE_URL: str
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_NAME: str

    # ---------- JWT ----------
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # ---------- Groq AI Configuration ----------
    GROQ_API_KEYS: str = ""
    GROQ_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    AI_MAX_TOKENS: int = 4000
    AI_TIMEOUT: int = 120
    MAX_DIFF_SIZE: int = 20000
    MAX_FILES_CONTEXT: int = 5
    MAX_FILE_CONTENT_SIZE: int = 2000

    # ---------- Environment Variables ----------
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "https://reviewly-sable.vercel.app"
    BACKEND_URL: str = "https://reviewly-s3w3.onrender.com"

    # ---------- Email Configuration ----------
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str
    SMTP_FROM_NAME: str

    # ---------- Upload Configuration ----------
    UPLOAD_DIR: str = "uploads"
    MAX_AVATAR_SIZE: int = 2 * 1024 * 1024
    ALLOWED_AVATAR_TYPES: str = "image/jpeg,image/png,image/gif,image/webp"

    # ---------- Cloudinary Configuration ----------
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ---------- Google OAuth Configuration ----------
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://reviewly-s3w3.onrender.com/auth/google/callback"

    # ---------- Stripe Configuration ----------
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PLUS_PRICE_ID: str = ""
    STRIPE_PRO_PRICE_ID: str = ""

    @property
    def allowed_avatar_types_list(self) -> list:
        return [t.strip() for t in self.ALLOWED_AVATAR_TYPES.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def groq_api_keys_list(self) -> List[str]:
        if not self.GROQ_API_KEYS:
            return []
        return [key.strip() for key in self.GROQ_API_KEYS.split(",") if key.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://") and "+psycopg2" not in url:
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
