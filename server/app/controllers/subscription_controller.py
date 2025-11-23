from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionChangeRequest,
    SubscriptionChangeResponse,
    SubscriptionPlan,
    SubscriptionPlansResponse,
    UsageStatsResponse,
)
from app.services import subscription_service

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


@router.get("/status", response_model=UsageStatsResponse)
def get_subscription_status(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get current subscription tier and usage stats"""
    return subscription_service.get_usage_stats(db, current_user.id)


@router.post("/change-tier", response_model=SubscriptionChangeResponse)
def change_tier(
    request: SubscriptionChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Change subscription tier (no payment required for now)"""
    user = subscription_service.change_subscription_tier(db, current_user.id, request.tier)

    return SubscriptionChangeResponse(
        message=f"Subscription updated to {request.tier}",
        tier=user.subscription_tier.value,
        updated_at=user.subscription_updated_at.isoformat() if user.subscription_updated_at else None,
    )


@router.get("/plans", response_model=SubscriptionPlansResponse)
def get_available_plans():
    """Get available subscription plans"""
    plans = [
        SubscriptionPlan(
            tier="free",
            name="Free",
            price=0,
            ai_reviews_per_month=10,
            description="Perfect for trying out CodeReview",
        ),
        SubscriptionPlan(
            tier="plus",
            name="Plus",
            price=15,  # TND (for future payment)
            ai_reviews_per_month=100,
            description="For individual developers and small teams",
        ),
        SubscriptionPlan(
            tier="pro",
            name="Pro",
            price=45,
            ai_reviews_per_month=-1,
            description="For growing teams and companies",
        ),
    ]

    return SubscriptionPlansResponse(plans=plans)
