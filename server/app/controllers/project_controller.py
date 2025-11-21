from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Union, Optional
from app.core.dependencies import get_current_active_user, get_db, require_admin
from app.models.user import User, UserRole
from app.models.project import Project
from app.schemas.project import (
    ProjectCreateGitHub, ProjectListResponse,
    ProjectCreateGitLab, ProjectResponseWithStats,
    ProjectUpdate,
    ProjectResponse,
    ProjectResponseWithoutTokens
)
from app.services import project_service
from app.core.logging_config import security_logger

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("/github", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_github_project(
    project_data: ProjectCreateGitHub,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        project = project_service.create_github_project(db, project_data, current_user.id)
        security_logger.info(f"GitHub project created: {project.name} by user {current_user.email}")
        return project
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/gitlab", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_gitlab_project(
    project_data: ProjectCreateGitLab,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        project = project_service.create_gitlab_project(db, project_data, current_user.id)
        security_logger.info(f"GitLab project created: {project.name} by user {current_user.email}")
        return project
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=ProjectListResponse, status_code=status.HTTP_200_OK)
def get_user_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    platform: Optional[str] = Query(None, regex="^(github|gitlab|all)$"),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = project_service.get_user_projects(
        db=db,
        user_id=current_user.id,
        page=page,
        per_page=per_page,
        platform=platform,
        is_active=is_active
    )
    return result


@router.get("/{project_id}", response_model=ProjectResponseWithStats, status_code=status.HTTP_200_OK)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERUSER]:
        project = project_service.get_project_by_id(db, project_id)
    else:
        project = project_service.get_project_by_id(db, project_id, user_id=current_user.id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    stats = project_service.get_project_stats(project)
    
    project_dict = ProjectResponse.from_orm(project).model_dump()
    project_dict['stats'] = stats
    
    return ProjectResponseWithStats(**project_dict)



@router.put("/{project_id}", response_model=ProjectResponse, status_code=status.HTTP_200_OK)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERUSER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins and superusers have read-only access to projects"
        )
    
    project_data_dict = project_data.model_dump(exclude_unset=True)
    updated_project = project_service.update_project(db, project_id, project_data_dict, current_user.id)
    
    if not updated_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have permission to update it"
        )
    
    security_logger.info(f"Project updated: {updated_project.name} by user {current_user.email}")
    return updated_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERUSER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins and superusers have read-only access to projects"
        )
    
    success = project_service.delete_project(db, project_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have permission to delete it"
        )
    
    security_logger.info(f"Project deleted: ID {project_id} by user {current_user.email}")
    return None

