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
        .filter(PRComment.project_id == project_id, PRComment.pr_number == pr_number, PRComment.is_deleted is False)
        .order_by(PRComment.created_at.desc())
        .all()
    )

    return comments


async def update_pr_comment(db: Session, comment_id: int, user_id: int, new_comment_text: str) -> PRComment:
    comment = db.query(PRComment).filter(PRComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this comment")
    if comment.is_deleted:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Comment has been deleted")

    project = project_service.get_project_by_id(db, comment.project_id, user_id=user_id)

    if project.platform == PlatformType.GITHUB:
        github_service.update_pr_comment(
            token=project.github_token,
            owner=project.github_repo_owner,
            repo=project.github_repo_name,
            comment_id=comment.github_comment_id,
            new_body=new_comment_text,
        )
    else:
        gitlab_service.update_mr_comment(
            token=project.gitlab_token,
            project_id=project.gitlab_project_id,
            mr_iid=comment.pr_number,
            note_id=comment.gitlab_note_id,
            new_body=new_comment_text,
        )

    comment.comment_text = new_comment_text
    db.commit()
    db.refresh(comment)

    security_logger.info(f"User {user_id} updated comment {comment_id}")

    return comment


async def delete_pr_comment(db: Session, comment_id: int, user_id: int) -> None:
    comment = db.query(PRComment).filter(PRComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")
    if comment.is_deleted:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Comment already deleted")

    project = project_service.get_project_by_id(db, comment.project_id, user_id=user_id)

    if project.platform == PlatformType.GITHUB:
        github_service.delete_pr_comment(
            token=project.github_token,
            owner=project.github_repo_owner,
            repo=project.github_repo_name,
            comment_id=comment.github_comment_id,
        )
    else:
        gitlab_service.delete_mr_comment(
            token=project.gitlab_token,
            project_id=project.gitlab_project_id,
            mr_iid=comment.pr_number,
            note_id=comment.gitlab_note_id,
        )

    comment.is_deleted = True
    db.commit()

    security_logger.info(f"User {user_id} deleted comment {comment_id}")


async def create_inline_pr_comment(
    db: Session,
    project_id: int,
    pr_number: int,
    user_id: int,
    comment_text: str,
    commit_sha: str,
    file_path: str,
    line_number: int,
    line_end: int = None,
) -> PRComment:
    project = project_service.get_project_by_id(db, project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    if project.platform == PlatformType.GITHUB:
        try:
            result = github_service.create_inline_pr_comment(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                pr_number=pr_number,
                comment_body=comment_text,
                commit_id=commit_sha,
                file_path=file_path,
                line=line_number,
            )
            github_id = result["comment_id"]
            gitlab_id = None
        except HTTPException as e:
            security_logger.error(
                f"GitHub inline comment failed: {e.detail} | commit={commit_sha}, file={file_path}, line={line_number}"
            )
            raise
        except Exception as e:
            security_logger.error(f"Unexpected error creating inline comment: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    else:
        result = gitlab_service.create_inline_mr_comment(
            token=project.gitlab_token,
            project_id=project.gitlab_project_id,
            mr_iid=pr_number,
            comment_body=comment_text,
            commit_sha=commit_sha,
            file_path=file_path,
            new_line=line_number,
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
        file_path=file_path,
        line_number=line_number,
        line_end=line_end,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    security_logger.info(f"User {user_id} posted inline comment on {file_path}:{line_number} in PR #{pr_number}")

    return comment
