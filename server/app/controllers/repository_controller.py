from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.core.logging_config import security_logger
from app.models.project import PlatformType, Project
from app.models.user import User, UserRole
from app.schemas.repository import (
    Branch,
    BranchListResponse,
    FileContent,
    FileContentResponse,
    FileDiff,
    FileDiffResponse,
    PullRequestDetails,
    PullRequestDetailsResponse,
    PullRequestListResponse,
    PullRequestSummary,
)
from app.services import github_service, gitlab_service
from app.services.cache_service import cache_service

router = APIRouter(prefix="/projects", tags=["Repository"])


def _get_project_with_permission(project_id: int, current_user: User, db: Session) -> Project:

    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project with ID {project_id} not found")

    is_owner = project.user_id == current_user.id
    is_privileged = current_user.role in [UserRole.ADMIN, UserRole.SUPERUSER]

    if not (is_owner or is_privileged):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to access this project"
        )

    return project


@router.get("/{project_id}/branches", response_model=BranchListResponse)
def get_project_branches(
    project_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):

    project = _get_project_with_permission(project_id, current_user, db)

    try:
        if project.platform == PlatformType.GITHUB:
            branches_data = github_service.fetch_branches(
                token=project.github_token, owner=project.github_repo_owner, repo=project.github_repo_name
            )
        elif project.platform == PlatformType.GITLAB:
            branches_data = gitlab_service.fetch_branches(
                token=project.gitlab_token, project_id=project.gitlab_project_id
            )
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported platform")

        branches = [Branch(**branch) for branch in branches_data]

        security_logger.info(f"User {current_user.email} fetched {len(branches)} branches from project {project.name}")

        return BranchListResponse(project_id=project_id, platform=project.platform, branches=branches)

    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(f"Error fetching branches: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch branches")


@router.get("/{project_id}/pull-requests", response_model=PullRequestListResponse)
def get_pull_requests(
    project_id: int,
    state: str = Query("open", regex="^(open|opened|closed|merged|all)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    refresh: bool = Query(False, description="Bypass cache and fetch fresh data"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):

    project = _get_project_with_permission(project_id, current_user, db)

    try:
        # Clear cache if refresh requested
        if refresh:
            if project.platform == PlatformType.GITHUB:
                cache_service.invalidate(
                    "github:prs",
                    owner=project.github_repo_owner,
                    repo=project.github_repo_name,
                    state=state if state in ["open", "closed", "all"] else "open",
                    page=page,
                    per_page=per_page,
                )
            elif project.platform == PlatformType.GITLAB:
                cache_service.invalidate(
                    "gitlab:mrs",
                    project_id=project.gitlab_project_id,
                    state="opened" if state == "open" else state,
                    page=page,
                    per_page=per_page,
                )
            security_logger.info(f"Cache invalidated for project {project_id} PRs (refresh requested)")

        if project.platform == PlatformType.GITHUB:
            # GitHub uses 'open', 'closed', 'all'
            github_state = state if state in ["open", "closed", "all"] else "open"
            prs_data = github_service.fetch_pull_requests(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                state=github_state,
                page=page,
                per_page=per_page,
            )
            pull_requests = prs_data["pull_requests"]

        elif project.platform == PlatformType.GITLAB:
            gitlab_state = "opened" if state == "open" else state
            mrs_data = gitlab_service.fetch_merge_requests(
                token=project.gitlab_token,
                project_id=project.gitlab_project_id,
                state=gitlab_state,
                page=page,
                per_page=per_page,
            )
            pull_requests = mrs_data["merge_requests"]

        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported platform")

        prs = [PullRequestSummary(**pr) for pr in pull_requests]

        security_logger.info(f"User {current_user.email} fetched {len(prs)} PRs/MRs from project {project.name}")

        return PullRequestListResponse(
            project_id=project_id,
            platform=project.platform,
            total=len(prs),
            page=page,
            per_page=per_page,
            pull_requests=prs,
        )

    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(f"Error fetching PRs/MRs: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch pull requests")


@router.get("/{project_id}/pull-requests/{pr_number}", response_model=PullRequestDetailsResponse)
def get_pull_request_details(
    project_id: int,
    pr_number: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):

    project = _get_project_with_permission(project_id, current_user, db)

    try:
        if project.platform == PlatformType.GITHUB:
            pr_data = github_service.fetch_pull_request_details(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                pr_number=pr_number,
            )
        elif project.platform == PlatformType.GITLAB:
            pr_data = gitlab_service.fetch_merge_request_details(
                token=project.gitlab_token, project_id=project.gitlab_project_id, mr_iid=pr_number
            )
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported platform")

        pr_details = PullRequestDetails(**pr_data)

        security_logger.info(
            f"User {current_user.email} fetched PR/MR #{pr_number} details from project {project.name}"
        )

        return PullRequestDetailsResponse(project_id=project_id, platform=project.platform, pull_request=pr_details)

    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(f"Error fetching PR/MR details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch pull request details: {str(e)}"
        )


@router.get("/{project_id}/files", response_model=FileContentResponse)
def get_file_content(
    project_id: int,
    path: str = Query(..., description="File path in the repository"),
    branch: str = Query("main", description="Branch name"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):

    project = _get_project_with_permission(project_id, current_user, db)

    try:
        if project.platform == PlatformType.GITHUB:
            file_data = github_service.fetch_file_content(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                file_path=path,
                branch=branch,
            )
        elif project.platform == PlatformType.GITLAB:
            file_data = gitlab_service.fetch_file_content(
                token=project.gitlab_token, project_id=project.gitlab_project_id, file_path=path, branch=branch
            )
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported platform")

        file_content = FileContent(**file_data)

        security_logger.info(f"User {current_user.email} fetched file {path} from project {project.name}@{branch}")

        return FileContentResponse(project_id=project_id, platform=project.platform, file=file_content)

    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(f"Error fetching file content: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch file content")


@router.get("/{project_id}/pull-requests/{pr_number}/files/diff", response_model=FileDiffResponse)
def get_file_diff(
    project_id: int,
    pr_number: int,
    path: str = Query(..., description="File path in the PR/MR"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):

    project = _get_project_with_permission(project_id, current_user, db)

    try:
        if project.platform == PlatformType.GITHUB:
            diff_data = github_service.fetch_file_diff(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                pr_number=pr_number,
                file_path=path,
            )
        elif project.platform == PlatformType.GITLAB:
            diff_data = gitlab_service.fetch_file_diff(
                token=project.gitlab_token, project_id=project.gitlab_project_id, mr_iid=pr_number, file_path=path
            )
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported platform")

        file_diff = FileDiff(**diff_data)

        security_logger.info(
            f"User {current_user.email} fetched diff for {path} in PR/MR #{pr_number} from project {project.name}"
        )

        return FileDiffResponse(project_id=project_id, pr_number=pr_number, platform=project.platform, file=file_diff)

    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(f"Error fetching file diff: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch file diff")
