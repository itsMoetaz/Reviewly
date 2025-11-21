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
    GROQ_API_KEYS: str = ""  # Comma-separated API keys
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    AI_MAX_TOKENS: int = 4000
    AI_TIMEOUT: int = 120
    MAX_DIFF_SIZE: int = 20000
    MAX_FILES_CONTEXT: int = 5
    MAX_FILE_CONTENT_SIZE: int = 2000

    # ---------- Environment Variables ----------
    ENVIRONMENT: str = "development"

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
