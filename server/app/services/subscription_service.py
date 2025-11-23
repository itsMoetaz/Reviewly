from datetime import datetime
from typing import Dict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging_config import security_logger
from app.models.usage_tracking import UsageTracking
from app.models.user import SubscriptionTier, User

TIER_LIMITS = {
    SubscriptionTier.FREE: 10,
    SubscriptionTier.PLUS: 100,
    SubscriptionTier.PRO: -1,
}


def get_or_create_usage(db: Session, user_id: int) -> UsageTracking:
    """Get or create usage tracking for current month"""
    now = datetime.utcnow()
    year = now.year
    month = now.month

    usage = (
        db.query(UsageTracking)
        .filter(UsageTracking.user_id == user_id, UsageTracking.year == year, UsageTracking.month == month)
        .first()
    )

    if not usage:
        usage = UsageTracking(user_id=user_id, year=year, month=month, ai_reviews_count=0)
        db.add(usage)
        db.commit()
        db.refresh(usage)

    return usage


def check_ai_review_quota(db: Session, user_id: int) -> bool:
    """Check if user can create another AI review - raises HTTPException if quota exceeded"""
    user = db.query(User).filter(User.id == user_id).first()

    tier = user.subscription_tier or SubscriptionTier.FREE
    limit = TIER_LIMITS.get(tier, 10)

    if limit == -1:
        return True

    usage = get_or_create_usage(db, user_id)

    if usage.ai_reviews_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "AI review quota exceeded",
                "current_usage": usage.ai_reviews_count,
                "quota": limit,
                "tier": tier.value,
                "message": (
                    f"You've used {usage.ai_reviews_count}/{limit} AI reviews this month. "
                    "Upgrade to Plus or Pro to continue."
                ),
            },
        )

    return True


def increment_ai_review_count(db: Session, user_id: int):
    """Increment AI review counter after successful creation"""
    usage = get_or_create_usage(db, user_id)
    usage.ai_reviews_count += 1
    usage.updated_at = datetime.utcnow()
    db.commit()

    security_logger.info(f"User {user_id} AI review count: {usage.ai_reviews_count}")


def get_usage_stats(db: Session, user_id: int) -> Dict:
    """Get current usage stats for user dashboard"""
    user = db.query(User).filter(User.id == user_id).first()
    tier = user.subscription_tier or SubscriptionTier.FREE
    limit = TIER_LIMITS.get(tier, 10)

    usage = get_or_create_usage(db, user_id)

    now = datetime.utcnow()
    if now.month == 12:
        next_month = 1
        next_year = now.year + 1
    else:
        next_month = now.month + 1
        next_year = now.year

    resets_at = f"{next_year}-{next_month:02d}-01 00:00:00"

    return {
        "tier": tier.value,
        "ai_reviews": {
            "used": usage.ai_reviews_count,
            "limit": limit,
            "unlimited": limit == -1,
            "percentage": 0 if limit == -1 else int((usage.ai_reviews_count / limit) * 100),
        },
        "resets_at": resets_at,
    }


def change_subscription_tier(db: Session, user_id: int, new_tier: str) -> User:
    """Change user's subscription tier (no payment required for now)"""
    try:
        tier_enum = SubscriptionTier(new_tier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tier. Must be one of: free, plus, pro",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_tier = user.subscription_tier
    user.subscription_tier = tier_enum
    user.subscription_updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    security_logger.info(f"User {user_id} subscription changed: {old_tier.value if old_tier else 'none'} → {new_tier}")

    return user
