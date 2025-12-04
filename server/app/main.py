import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from app.config.settings import settings
from app.controllers.routes import register_routes
from app.core.exception_config import register_exception_handlers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


def setup_static_files(app: FastAPI) -> None:
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Application starting up...")
    yield
    logger.info("🛑 Application shutting down...")


app = FastAPI(
    title="CodeReview API",
    description="Backend API for CodeReview application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter

app.add_middleware(SecurityHeadersMiddleware)

# Build allowed origins list
allowed_origins = [settings.FRONTEND_URL.rstrip("/")]
# Also allow localhost for development
if not settings.is_production:
    allowed_origins.extend(
        [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

register_routes(app)

setup_static_files(app)


@app.get("/")
def read_root():
    return {"Message": "Welcome to Reviewly"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "CodeReview API", "version": "1.0.0"}


@app.get("/debug/cors")
def debug_cors():
    """Debug endpoint to verify CORS configuration"""
    return {
        "frontend_url": settings.FRONTEND_URL,
        "allowed_origins": allowed_origins,
        "environment": settings.ENVIRONMENT,
        "is_production": settings.is_production,
    }
