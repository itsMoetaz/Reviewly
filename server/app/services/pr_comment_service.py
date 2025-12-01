from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging_config import security_logger
from app.models.pr_comment import PRComment
from app.models.project import PlatformType
from app.models.project_member import ProjectMemberRole
from app.services import github_service, gitlab_service, project_service, team_service


async def create_pr_comment(db: Session, project_id: int, pr_number: int, user_id: int, comment_text: str) -> PRComment:
    team_service.require_permission(db, project_id, user_id, ProjectMemberRole.REVIEWER)

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


def _build_reactions_summary(comment: PRComment, user_id: int) -> dict:
    """Build reactions summary from loaded reactions for a comment."""
    counts = {
        "thumbs_up": 0,
        "thumbs_down": 0,
        "heart": 0,
        "rocket": 0,
        "eyes": 0,
        "party": 0,
    }
    user_reactions = []

    for reaction in comment.reactions:
        if reaction.reaction_type in counts:
            counts[reaction.reaction_type] += 1
        if reaction.user_id == user_id:
            user_reactions.append(reaction.reaction_type)

    return {
        **counts,
        "user_reactions": user_reactions,
    }


def get_pr_comments(
    db: Session, project_id: int, pr_number: int, user_id: int, page: int = 1, per_page: int = 20
) -> dict:
    from sqlalchemy.orm import joinedload

    project = project_service.get_project_by_id(db, project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    query = (
        db.query(PRComment)
        .options(joinedload(PRComment.reactions))
        .filter(
            PRComment.project_id == project_id,
            PRComment.pr_number == pr_number,
            PRComment.is_deleted.is_(False),
        )
        .order_by(PRComment.created_at.desc())
    )

    total = query.count()

    offset = (page - 1) * per_page
    comments = query.offset(offset).limit(per_page).all()

    total_pages = (total + per_page - 1) // per_page

    # Build response with reactions_summary for each comment
    comments_with_reactions = []
    for comment in comments:
        comment_dict = {
            "id": comment.id,
            "project_id": comment.project_id,
            "pr_number": comment.pr_number,
            "user_id": comment.user_id,
            "comment_text": comment.comment_text,
            "github_comment_id": comment.github_comment_id,
            "gitlab_note_id": comment.gitlab_note_id,
            "is_deleted": comment.is_deleted,
            "file_path": comment.file_path,
            "line_number": comment.line_number,
            "line_end": comment.line_end,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "reactions_summary": _build_reactions_summary(comment, user_id),
        }
        comments_with_reactions.append(comment_dict)

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "comments": comments_with_reactions,
    }


async def update_pr_comment(db: Session, comment_id: int, user_id: int, new_comment_text: str) -> PRComment:
    comment = db.query(PRComment).filter(PRComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this comment")
    if comment.is_deleted:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Comment has been deleted")

    project = project_service.get_project_by_id(db, comment.project_id, user_id=user_id)

    # Check if this is an inline comment (has file_path) or a general comment
    is_inline_comment = comment.file_path is not None

    if project.platform == PlatformType.GITHUB:
        if is_inline_comment:
            # Use PR review comment endpoint for inline comments
            github_service.update_pr_review_comment(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                comment_id=comment.github_comment_id,
                new_body=new_comment_text,
            )
        else:
            # Use issue comment endpoint for general comments
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

    # Check if this is an inline comment (has file_path) or a general comment
    is_inline_comment = comment.file_path is not None

    if project.platform == PlatformType.GITHUB:
        if is_inline_comment:
            # Use PR review comment endpoint for inline comments
            github_service.delete_pr_review_comment(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                comment_id=comment.github_comment_id,
            )
        else:
            # Use issue comment endpoint for general comments
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
