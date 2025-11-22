from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging_config import security_logger
from app.models.pr_comment import PRComment
from app.models.project import PlatformType
from app.services import github_service, gitlab_service, project_service


async def create_pr_comment(db: Session, project_id: int, pr_number: int, user_id: int, comment_text: str) -> PRComment:
    project = project_service.get_project_by_id(db, project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    if project.platform == PlatformType.GITHUB:
        result = github_service.create_pr_comment(
            token=project.github_token,
            owner=project.github_repo_owner,
            repo=project.github_repo_name,
            pr_number=pr_number,
            comment_body=comment_text,
        )
        github_id = result["comment_id"]
        gitlab_id = None
    else:
        result = gitlab_service.create_mr_comment(
            token=project.gitlab_token,
            project_id=project.gitlab_project_id,
            mr_iid=pr_number,
            comment_body=comment_text,
        )
        github_id = None
        gitlab_id = result["note_id"]

    comment = PRComment(
        project_id=project_id,
        pr_number=pr_number,
        user_id=user_id,
        comment_text=comment_text,
        github_comment_id=github_id,
        gitlab_note_id=gitlab_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    security_logger.info(
        f"User {user_id} posted comment to PR/MR #{pr_number} in project {project_id} ({project.platform.value})"
    )

    return comment


def get_pr_comments(db: Session, project_id: int, pr_number: int, user_id: int) -> List[PRComment]:
    project = project_service.get_project_by_id(db, project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    comments = (
        db.query(PRComment)
        .filter(PRComment.project_id == project_id, PRComment.pr_number == pr_number)
        .order_by(PRComment.created_at.desc())
        .all()
    )

    return comments
