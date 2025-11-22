from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.core.logging_config import security_logger
from app.models.user import User
from app.schemas.ai_review import AIReviewCreate, AIReviewResponse, AIReviewWithIssues, ReviewIssueResponse
from app.services import review_service

router = APIRouter(prefix="/ai-reviews", tags=["AI Code Reviews"])


@router.post(
    "/projects/{project_id}/pull-requests/{pr_number}",
    response_model=AIReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ai_review(
    project_id: int,
    pr_number: int,
    review_data: AIReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Trigger AI code review for a pull request.

    The AI will analyze the PR diff and provide:
    - Security issues
    - Bug detection
    - Performance problems
    - Code quality suggestions
    - Best practice violations

    Returns immediately with processing status.
    """
    try:
        review = await review_service.create_and_process_review(
            db=db,
            project_id=project_id,
            pr_number=pr_number,
            user_id=current_user.id,
            include_context=review_data.include_context,
        )

        security_logger.info(f"AI review #{review.id} created for PR #{pr_number} " f"by {current_user.email}")

        return review

    except HTTPException:
        raise
    except Exception as e:
        security_logger.error(f"Failed to create review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to process AI review: {str(e)}"
        )


@router.get("/{review_id}", response_model=AIReviewWithIssues)
def get_ai_review(review_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Get AI review results with all detected issues.

    Returns comprehensive review including:
    - Overall summary and rating
    - List of all issues found
    - Processing statistics
    """
    review = review_service.get_review_by_id(db, review_id, current_user.id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    # Build response with additional data
    return AIReviewWithIssues(
        **AIReviewResponse.from_orm(review).model_dump(),
        issues=[ReviewIssueResponse.from_orm(issue) for issue in review.issues],
        project_name=review.project.name,
        requester_username=review.requester.username,
    )


@router.get("/projects/{project_id}/pull-requests/{pr_number}", response_model=List[AIReviewResponse])
def get_reviews_for_pr(
    project_id: int,
    pr_number: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all AI reviews for a specific pull request.

    Useful to see review history or multiple perspectives.
    """
    reviews = review_service.get_reviews_for_pr(
        db=db, project_id=project_id, pr_number=pr_number, user_id=current_user.id
    )
    return reviews


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_review(
    review_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """
    Delete an AI review.

    Only the user who requested the review can delete it.
    """
    success = review_service.delete_review(db, review_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    security_logger.info(f"AI review #{review_id} deleted by {current_user.email}")
    return None
