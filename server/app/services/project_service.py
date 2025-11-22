from typing import Optional

import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging_config import security_logger
from app.models.project import PlatformType, Project
from app.schemas.project import ProjectCreateGitHub, ProjectCreateGitLab
from app.services import github_service, gitlab_service
from app.services.cache_service import cache_service


def verify_github_token(token: str, owner: str, repo: str) -> bool:
    try:
        headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}
        response = requests.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers, timeout=5)
        return response.status_code == 200
    except Exception as e:
        security_logger.error(f"GitHub token verification failed for {owner}/{repo}: {e}")
        return False


def verify_gitlab_token(token: str, project_id: int) -> bool:
    try:
        headers = {
            "Authorization": f"Bearer {token}",
        }
        response = requests.get(f"https://gitlab.com/api/v4/projects/{project_id}", headers=headers, timeout=5)
        return response.status_code == 200
    except Exception as e:
        security_logger.error(f"GitLab token verification failed for project {project_id}: {e}")
        return False


def create_github_project(db: Session, project_data: ProjectCreateGitHub, user_id: int) -> Project:
    if not verify_github_token(
        project_data.github_token, project_data.github_repo_owner, project_data.github_repo_name
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid GitHub token")

    project = Project(
        name=project_data.name,
        description=project_data.description,
        platform=PlatformType.GITHUB,
        repository_url=project_data.repository_url,
        github_token=project_data.github_token,
        github_repo_owner=project_data.github_repo_owner,
        github_repo_name=project_data.github_repo_name,
        user_id=user_id,
        is_active=True,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def create_gitlab_project(db: Session, project_data: ProjectCreateGitLab, user_id: int) -> Project:
    if not verify_gitlab_token(project_data.gitlab_token, project_data.gitlab_project_id):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid GitLab token")

    project = Project(
        name=project_data.name,
        description=project_data.description,
        platform=PlatformType.GITLAB,
        repository_url=project_data.repository_url,
        gitlab_token=project_data.gitlab_token,
        gitlab_project_id=project_data.gitlab_project_id,
        user_id=user_id,
        is_active=True,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_user_projects(
    db: Session,
    user_id: int,
    page: int = 1,
    per_page: int = 20,
    platform: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> dict:
    query = db.query(Project).filter(Project.user_id == user_id)

    if platform and platform != "all":
        if platform == "github":
            query = query.filter(Project.platform == PlatformType.GITHUB)
        elif platform == "gitlab":
            query = query.filter(Project.platform == PlatformType.GITLAB)

    if is_active is not None:
        query = query.filter(Project.is_active == is_active)

    query = query.order_by(Project.updated_at.desc())

    total = query.count()

    offset = (page - 1) * per_page
    projects = query.offset(offset).limit(per_page).all()

    total_pages = (total + per_page - 1) // per_page

    return {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages, "projects": projects}


def get_project_stats(project: Project) -> dict:

    stats = {
        "branches_count": 0,
        "open_prs_count": 0,
        "closed_prs_count": 0,
        "total_prs_count": 0,
        "last_activity": project.updated_at,
    }

    try:
        if project.platform == PlatformType.GITHUB:
            branches = github_service.fetch_branches(
                token=project.github_token, owner=project.github_repo_owner, repo=project.github_repo_name
            )
            stats["branches_count"] = len(branches)

            open_prs = github_service.fetch_pull_requests(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                state="open",
                page=1,
                per_page=100,
            )
            stats["open_prs_count"] = len(open_prs["pull_requests"])

            closed_prs = github_service.fetch_pull_requests(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                state="closed",
                page=1,
                per_page=100,
            )
            stats["closed_prs_count"] = len(closed_prs["pull_requests"])

            stats["total_prs_count"] = stats["open_prs_count"] + stats["closed_prs_count"]

        elif project.platform == PlatformType.GITLAB:
            branches = gitlab_service.fetch_branches(token=project.gitlab_token, project_id=project.gitlab_project_id)
            stats["branches_count"] = len(branches)

            open_mrs = gitlab_service.fetch_merge_requests(
                token=project.gitlab_token, project_id=project.gitlab_project_id, state="opened", page=1, per_page=100
            )
            stats["open_prs_count"] = len(open_mrs["merge_requests"])

            closed_mrs = gitlab_service.fetch_merge_requests(
                token=project.gitlab_token, project_id=project.gitlab_project_id, state="closed", page=1, per_page=100
            )
            stats["closed_prs_count"] = len(closed_mrs["merge_requests"])

            stats["total_prs_count"] = stats["open_prs_count"] + stats["closed_prs_count"]

    except Exception as e:
        security_logger.error(f"Failed to fetch stats for project {project.id}: {str(e)}")

    return stats


def get_project_by_id(db: Session, project_id: int, user_id: Optional[int] = None) -> Optional[Project]:
    query = db.query(Project).filter(Project.id == project_id)

    if user_id is not None:
        query = query.filter(Project.user_id == user_id)

    return query.first()


def update_project(db: Session, project_id: int, project_data: dict, user_id: int) -> Optional[Project]:
    project = get_project_by_id(db, project_id, user_id=user_id)

    if not project:
        return None

    for key, value in project_data.items():
        if value is not None and hasattr(project, key):
            setattr(project, key, value)

    db.commit()
    db.refresh(project)

    cache_service.clear_project(project_id)

    return project


def delete_project(db: Session, project_id: int, user_id: int) -> bool:
    project = get_project_by_id(db, project_id, user_id=user_id)

    if not project:
        return False

    db.delete(project)
    db.commit()

    cache_service.clear_project(project_id)

    return True
