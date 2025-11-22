from typing import Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy import func
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

    reaction_counts = (
        db.query(CommentReaction.reaction_type, func.count(CommentReaction.id))
        .filter(CommentReaction.comment_id == comment_id)
        .group_by(CommentReaction.reaction_type)
        .all()
    )

    counts: Dict[str, int] = {reaction: count for reaction, count in reaction_counts}

    user_reactions = []
    if user_id:
        user_reaction_objs = (
            db.query(CommentReaction)
            .filter(CommentReaction.comment_id == comment_id, CommentReaction.user_id == user_id)
            .all()
        )
        user_reactions = [ReactionType(r.reaction_type) for r in user_reaction_objs]

    return ReactionsSummary(
        thumbs_up=counts.get("thumbs_up", 0),
        thumbs_down=counts.get("thumbs_down", 0),
        heart=counts.get("heart", 0),
        rocket=counts.get("rocket", 0),
        eyes=counts.get("eyes", 0),
        party=counts.get("party", 0),
        user_reactions=user_reactions,
    )
