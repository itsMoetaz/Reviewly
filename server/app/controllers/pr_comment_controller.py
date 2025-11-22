from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.pr_comment import PRCommentCreate, PRCommentResponse
from app.services import pr_comment_service

router = APIRouter(prefix="/pr-comments", tags=["PR Comments"])


@router.post(
    "/projects/{project_id}/pull-requests/{pr_number}",
    response_model=PRCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    project_id: int,
    pr_number: int,
    comment_data: PRCommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    comment = await pr_comment_service.create_pr_comment(
        db=db,
        project_id=project_id,
        pr_number=pr_number,
        user_id=current_user.id,
        comment_text=comment_data.comment_text,
    )

    return comment


@router.get("/projects/{project_id}/pull-requests/{pr_number}", response_model=List[PRCommentResponse])
def get_comments(
    project_id: int,
    pr_number: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    comments = pr_comment_service.get_pr_comments(
        db=db, project_id=project_id, pr_number=pr_number, user_id=current_user.id
    )

    return comments
