"""
Payment Controller
Handles Stripe payment endpoints for subscription management.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.core.dependencies import get_current_active_user, get_db
from app.models.user import User
from app.services.stripe_service import stripe_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


class CheckoutRequest(BaseModel):
    tier: str  # "plus" or "pro"


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


class SubscriptionStatusResponse(BaseModel):
    status: str
    tier: str
    cancel_at_period_end: bool
    current_period_end: int | None


class PublishableKeyResponse(BaseModel):
    publishable_key: str


class CancelRequest(BaseModel):
    immediate: bool = False  # If true, cancel immediately; otherwise cancel at period end


class SwitchPlanRequest(BaseModel):
    new_tier: str  # "plus" or "pro"


class SubscriptionActionResponse(BaseModel):
    status: str
    message: str
    tier: str | None = None
    cancel_at: int | None = None


@router.get("/config", response_model=PublishableKeyResponse)
def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return PublishableKeyResponse(publishable_key=settings.STRIPE_PUBLISHABLE_KEY)


@router.post("/create-checkout-session", response_model=CheckoutResponse)
def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for subscription purchase"""
    if request.tier not in ["plus", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'plus' or 'pro'")

    # Define success and cancel URLs
    success_url = f"{settings.FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{settings.FRONTEND_URL}/checkout/cancel"

    try:
        checkout_url = stripe_service.create_checkout_session(
            db=db,
            user=current_user,
            tier=request.tier,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return CheckoutResponse(checkout_url=checkout_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/create-portal-session", response_model=PortalResponse)
def create_portal_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Customer Portal session for subscription management"""
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No active subscription found. Please subscribe first.",
        )

    return_url = f"{settings.FRONTEND_URL}/profile"

    try:
        portal_url = stripe_service.create_portal_session(
            db=db,
            user=current_user,
            return_url=return_url,
        )
        return PortalResponse(portal_url=portal_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")


@router.get("/subscription", response_model=SubscriptionStatusResponse)
def get_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current subscription status"""
    status = stripe_service.get_subscription_status(db, current_user)
    return SubscriptionStatusResponse(**status)


@router.post("/cancel", response_model=SubscriptionActionResponse)
def cancel_subscription(
    request: CancelRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Cancel subscription - either immediately or at period end"""
    try:
        result = stripe_service.cancel_subscription(db, current_user, request.immediate)
        return SubscriptionActionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")


@router.post("/reactivate", response_model=SubscriptionActionResponse)
def reactivate_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Reactivate a subscription that was set to cancel at period end"""
    try:
        result = stripe_service.reactivate_subscription(db, current_user)
        return SubscriptionActionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reactivate subscription: {str(e)}")


@router.post("/switch", response_model=SubscriptionActionResponse)
def switch_subscription(
    request: SwitchPlanRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Switch subscription to a different tier"""
    if request.new_tier not in ["plus", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'plus' or 'pro'")

    try:
        result = stripe_service.switch_subscription(db, current_user, request.new_tier)
        return SubscriptionActionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch subscription: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    """Handle Stripe webhook events"""
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    payload = await request.body()

    try:
        result = stripe_service.handle_webhook_event(db, payload, stripe_signature)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")
