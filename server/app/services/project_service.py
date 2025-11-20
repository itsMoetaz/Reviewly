from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import requests
from app.schemas.project import ProjectCreateGitHub, ProjectCreateGitLab
from app.models.project import Project, PlatformType


def verify_github_token(token: str, owner: str, repo: str) -> bool:
    try:
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        response = requests.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers, timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def verify_gitlab_token(token: str, project_id: int) -> bool:
    try:
        headers = {
            "Authorization": f"Bearer {token}",
        }
        response = requests.get(f"https://gitlab.com/api/v4/projects/{project_id}", headers=headers, timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def create_github_project(db: Session, project_data: ProjectCreateGitHub, user_id: int) -> Project:
    if not verify_github_token(project_data.github_token, project_data.github_repo_owner, project_data.github_repo_name):
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
        is_active=True
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
        is_active=True
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_user_projects(db: Session, user_id: int) -> List[Project]:
    return db.query(Project).filter(Project.user_id == user_id).all()


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
    return project


def delete_project(db: Session, project_id: int, user_id: int) -> bool:
    project = get_project_by_id(db, project_id, user_id=user_id)
    
    if not project:
        return False
    
    db.delete(project)
    db.commit()
    return True
