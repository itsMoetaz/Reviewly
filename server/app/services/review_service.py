import time
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging_config import security_logger
from app.models.ai_review import AIReview, IssueSeverity, ReviewIssue, ReviewStatus
from app.services import github_service, gitlab_service, project_service
from app.services.ai_service import get_ai_service


async def create_and_process_review(
    db: Session, project_id: int, pr_number: int, user_id: int, include_context: bool = True
) -> AIReview:
    """Create and immediately process AI review"""

    existing = (
        db.query(AIReview)
        .filter(AIReview.project_id == project_id, AIReview.pr_number == pr_number, AIReview.requested_by == user_id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You've already reviewed this PR. Delete the existing review first.",
        )

    project = project_service.get_project_by_id(db, project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    review = AIReview(project_id=project_id, pr_number=pr_number, requested_by=user_id, status=ReviewStatus.PENDING)
    db.add(review)
    db.commit()
    db.refresh(review)

    security_logger.info(
        f"AI review #{review.id} created for PR #{pr_number} in project {project.name} by user ID {user_id}"
    )

    try:
        await _process_review(db, review, project, include_context)
    except Exception as e:
        security_logger.error(f"Review processing failed: {e}")
        review.status = ReviewStatus.FAILED
        review.error_message = str(e)[:1000]
        db.commit()
        raise

    return review


async def _process_review(db: Session, review: AIReview, project, include_context: bool):
    """Internal function to process review"""

    start_time = time.time()

    try:
        review.status = ReviewStatus.PROCESSING
        db.commit()

        security_logger.info(f"Processing review #{review.id}")

        if project.platform.value == "github":
            pr_details = github_service.fetch_pull_request_details(
                token=project.github_token,
                owner=project.github_repo_owner,
                repo=project.github_repo_name,
                pr_number=review.pr_number,
            )
        else:
            pr_details = gitlab_service.fetch_merge_request_details(
                token=project.gitlab_token, project_id=project.gitlab_project_id, mr_iid=review.pr_number
            )

        pr_diff = _build_diff_from_files(pr_details.get("files", []))

        if not pr_diff:
            raise Exception("No code changes found in this PR")

        file_contents = None
        ai_service = get_ai_service()
        ai_result = await ai_service.analyze_code(pr_diff=pr_diff, pr_details=pr_details, file_contents=file_contents)

        review.summary = ai_result.get("summary", "")
        review.overall_rating = ai_result.get("rating", "Needs Work")
        review.files_analyzed = len(pr_details.get("files", []))
        review.tokens_used = ai_result.get("tokens_used", 0)
        review.api_key_used = ai_result.get("api_key_used")
        review.processing_time_seconds = int(time.time() - start_time)
        review.status = ReviewStatus.COMPLETED
        review.completed_at = datetime.utcnow()

        issues_list = ai_result.get("issues", [])
        for issue_data in issues_list:
            try:
                issue = ReviewIssue(
                    review_id=review.id,
                    file_path=issue_data.get("file", "unknown"),
                    line_number=issue_data.get("line"),
                    severity=IssueSeverity(issue_data.get("severity", "info")),
                    category=issue_data.get("category", "code_quality"),
                    title=issue_data.get("title", "Issue")[:255],
                    description=issue_data.get("description", ""),
                    suggestion=issue_data.get("suggestion"),
                )
                db.add(issue)
            except Exception as e:
                security_logger.warning(f"Failed to add issue: {e}")
                continue

        review.issues_found = len(issues_list)
        db.commit()

        security_logger.info(
            f"Review #{review.id} completed: {review.issues_found} issues, "
            f"{review.tokens_used} tokens, {review.processing_time_seconds}s, "
            f"rating: {review.overall_rating}"
        )

    except Exception as e:
        security_logger.error(f"Review processing error: {e}")
        review.status = ReviewStatus.FAILED
        review.error_message = str(e)[:1000]
        db.commit()
        raise


def _build_diff_from_files(files: list) -> str:
    """Build unified diff from file changes"""
    if not files:
        return ""

    diff_parts = []
    for file_data in files:
        filename = file_data.get("filename", file_data.get("new_path", "unknown"))
        diff_parts.append(f"\n--- a/{filename}")
        diff_parts.append(f"+++ b/{filename}")

        if "patch" in file_data and file_data["patch"]:
            diff_parts.append(file_data["patch"])
        elif "diff" in file_data and file_data["diff"]:
            diff_parts.append(file_data["diff"])

    return "\n".join(diff_parts)


def get_review_by_id(db: Session, review_id: int, user_id: int) -> Optional[AIReview]:
    """Get review with permission check"""
    review = db.query(AIReview).filter(AIReview.id == review_id).first()
    if not review:
        return None

    project = project_service.get_project_by_id(db, review.project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this project")

    return review


def delete_review(db: Session, review_id: int, user_id: int) -> bool:
    """Delete a review (owner only)"""
    review = db.query(AIReview).filter(AIReview.id == review_id).first()
    if not review:
        return False

    if review.requested_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only the review creator can delete this review"
        )

    security_logger.info(f"Deleting AI review #{review_id} by user ID {user_id}")
    db.delete(review)
    db.commit()
    return True


def get_reviews_for_pr(db: Session, project_id: int, pr_number: int, user_id: int) -> list:
    """Get all reviews for a specific PR"""
    project = project_service.get_project_by_id(db, project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or access denied")

    reviews = (
        db.query(AIReview)
        .filter(AIReview.project_id == project_id, AIReview.pr_number == pr_number)
        .order_by(AIReview.created_at.desc())
        .all()
    )

    return reviews
