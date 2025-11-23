from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.pr_comment import (
    InlineCommentCreate,
    PRCommentCreate,
    PRCommentResponse,
    PRCommentUpdate,
    ReactionCreate,
    ReactionResponse,
    ReactionsSummary,
)
from app.services import pr_comment_service, reaction_service

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


@router.get("/projects/{project_id}/pull-requests/{pr_number}")
def get_comments(
    project_id: int,
    pr_number: int,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    result = pr_comment_service.get_pr_comments(
        db=db, project_id=project_id, pr_number=pr_number, user_id=current_user.id, page=page, per_page=per_page
    )

    return result


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


@router.post("/{comment_id}/reactions", response_model=ReactionResponse, status_code=status.HTTP_201_CREATED)
def add_reaction(
    comment_id: int,
    reaction_data: ReactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    reaction = reaction_service.add_reaction(
        db=db, comment_id=comment_id, user_id=current_user.id, reaction_type=reaction_data.reaction_type.value
    )
    return reaction


@router.delete("/{comment_id}/reactions/{reaction_type}", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction(
    comment_id: int,
    reaction_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    reaction_service.remove_reaction(db=db, comment_id=comment_id, user_id=current_user.id, reaction_type=reaction_type)


@router.get("/{comment_id}/reactions", response_model=ReactionsSummary)
def get_reactions(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    summary = reaction_service.get_reactions_summary(db=db, comment_id=comment_id, user_id=current_user.id)
    return summary
