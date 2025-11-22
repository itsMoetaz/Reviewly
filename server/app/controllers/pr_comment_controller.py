from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.pr_comment import InlineCommentCreate, PRCommentCreate, PRCommentResponse, PRCommentUpdate
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


@router.put("/{comment_id}", response_model=PRCommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: PRCommentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    comment = await pr_comment_service.update_pr_comment(
        db=db, comment_id=comment_id, user_id=current_user.id, new_comment_text=comment_data.comment_text
    )

    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    await pr_comment_service.delete_pr_comment(db=db, comment_id=comment_id, user_id=current_user.id)


@router.post(
    "/projects/{project_id}/pull-requests/{pr_number}/inline",
    response_model=PRCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_inline_comment(
    project_id: int,
    pr_number: int,
    comment_data: InlineCommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    comment = await pr_comment_service.create_inline_pr_comment(
        db=db,
        project_id=project_id,
        pr_number=pr_number,
        user_id=current_user.id,
        comment_text=comment_data.comment_text,
        commit_sha=comment_data.commit_sha,
        file_path=comment_data.file_path,
        line_number=comment_data.line_number,
        line_end=comment_data.line_end,
    )

    return comment
