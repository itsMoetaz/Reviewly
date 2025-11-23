from fastapi import FastAPI

from app.controllers import (
    ai_review_controller,
    auth_controller,
    pr_comment_controller,
    project_controller,
    repository_controller,
    subscription_controller,
    team_controller,
)


def register_routes(app: FastAPI) -> None:
    app.include_router(auth_controller.router)
    app.include_router(project_controller.router)
    app.include_router(repository_controller.router)
    app.include_router(ai_review_controller.router)
    app.include_router(pr_comment_controller.router)
    app.include_router(team_controller.router)
    app.include_router(subscription_controller.router)
