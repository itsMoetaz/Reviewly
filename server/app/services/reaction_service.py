from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.core.logging_config import security_logger
from app.models.comment_reaction import CommentReaction
from app.models.pr_comment import PRComment
from app.schemas.pr_comment import ReactionsSummary, ReactionType


def add_reaction(db: Session, comment_id: int, user_id: int, reaction_type: str) -> CommentReaction:
    comment = db.query(PRComment).filter(PRComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    existing = (
        db.query(CommentReaction)
        .filter(
            CommentReaction.comment_id == comment_id,
            CommentReaction.user_id == user_id,
            CommentReaction.reaction_type == reaction_type,
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already reacted with this type")

    reaction = CommentReaction(comment_id=comment_id, user_id=user_id, reaction_type=reaction_type)
    db.add(reaction)
    db.commit()
    db.refresh(reaction)

    security_logger.info(f"User {user_id} added {reaction_type} reaction to comment {comment_id}")

    return reaction


def remove_reaction(db: Session, comment_id: int, user_id: int, reaction_type: str) -> None:
    reaction = (
        db.query(CommentReaction)
        .filter(
            CommentReaction.comment_id == comment_id,
            CommentReaction.user_id == user_id,
            CommentReaction.reaction_type == reaction_type,
        )
        .first()
    )

    if not reaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reaction not found")

    db.delete(reaction)
    db.commit()

    security_logger.info(f"User {user_id} removed {reaction_type} reaction from comment {comment_id}")


def get_reactions_summary(db: Session, comment_id: int, user_id: Optional[int] = None) -> ReactionsSummary:

    comment = db.query(PRComment).filter(PRComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    result = (
        db.query(
            func.sum(case((CommentReaction.reaction_type == "thumbs_up", 1), else_=0)).label("thumbs_up"),
            func.sum(case((CommentReaction.reaction_type == "thumbs_down", 1), else_=0)).label("thumbs_down"),
            func.sum(case((CommentReaction.reaction_type == "heart", 1), else_=0)).label("heart"),
            func.sum(case((CommentReaction.reaction_type == "rocket", 1), else_=0)).label("rocket"),
            func.sum(case((CommentReaction.reaction_type == "eyes", 1), else_=0)).label("eyes"),
            func.sum(case((CommentReaction.reaction_type == "party", 1), else_=0)).label("party"),
        )
        .filter(CommentReaction.comment_id == comment_id)
        .first()
    )

    user_reactions = []
    if user_id:
        user_reactions = [
            ReactionType(r.reaction_type)
            for r in db.query(CommentReaction.reaction_type)
            .filter(CommentReaction.comment_id == comment_id, CommentReaction.user_id == user_id)
            .all()
        ]

    return ReactionsSummary(
        thumbs_up=result.thumbs_up or 0,
        thumbs_down=result.thumbs_down or 0,
        heart=result.heart or 0,
        rocket=result.rocket or 0,
        eyes=result.eyes or 0,
        party=result.party or 0,
        user_reactions=user_reactions,
    )
