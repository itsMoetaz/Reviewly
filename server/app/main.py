from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.controllers import auth_controller, project_controller, repository_controller
from app.core.exceptions import (
    validation_exception_handler,
    database_exception_handler,
    general_exception_handler
)
from app.core.logging_config import security_logger

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
    lifespan=lifespan
)

app.state.limiter = limiter

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, database_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(auth_controller.router)
app.include_router(project_controller.router)
app.include_router(repository_controller.router)


@app.get("/")
def read_root():
    return {"Message": "Welcome to Reviewly"}


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CodeReview API",
        "version": "1.0.0"
    }