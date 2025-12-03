"""
Stripe Payment Service
Handles all Stripe-related operations including checkout sessions,
webhooks, and customer portal.
"""

import stripe
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.models.user import SubscriptionTier, User

# Initialize Stripe with secret key
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Service class for Stripe payment operations"""

    TIER_TO_PRICE_ID = {
        "plus": settings.STRIPE_PLUS_PRICE_ID,
        "pro": settings.STRIPE_PRO_PRICE_ID,
    }

    PRICE_ID_TO_TIER = {
        settings.STRIPE_PLUS_PRICE_ID: SubscriptionTier.PLUS,
        settings.STRIPE_PRO_PRICE_ID: SubscriptionTier.PRO,
    }

    @staticmethod
    def get_or_create_customer(db: Session, user: User) -> str:
        """Get existing Stripe customer or create a new one"""
        if user.stripe_customer_id:
            return user.stripe_customer_id

        # Create new Stripe customer
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name or user.username,
            metadata={"user_id": str(user.id)},
        )

        # Save customer ID to user
        user.stripe_customer_id = customer.id
        db.commit()
        db.refresh(user)

        return customer.id

    @staticmethod
    def create_checkout_session(db: Session, user: User, tier: str, success_url: str, cancel_url: str) -> str:
        """Create a Stripe Checkout session for subscription"""
        if tier not in StripeService.TIER_TO_PRICE_ID:
            raise ValueError(f"Invalid tier: {tier}. Must be 'plus' or 'pro'")

        price_id = StripeService.TIER_TO_PRICE_ID[tier]
        customer_id = StripeService.get_or_create_customer(db, user)

        # Check if user already has an active subscription
        if user.stripe_subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)
                sub_status = getattr(subscription, "status", "unknown")

                # If subscription is active or trialing, redirect to portal
                if sub_status in ["active", "trialing"]:
                    portal_session = stripe.billing_portal.Session.create(
                        customer=customer_id,
                        return_url=cancel_url,
                    )
                    return portal_session.url

                # If subscription is canceled, clear the old subscription ID
                if sub_status in ["canceled", "incomplete_expired", "unpaid"]:
                    user.stripe_subscription_id = None
                    db.commit()
            except stripe.error.StripeError:
                # If we can't retrieve the subscription, clear it
                user.stripe_subscription_id = None
                db.commit()

        # Create new checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": str(user.id),
                "tier": tier,
            },
            subscription_data={
                "metadata": {
                    "user_id": str(user.id),
                    "tier": tier,
                }
            },
            allow_promotion_codes=True,
        )

        return checkout_session.url

    @staticmethod
    def create_portal_session(db: Session, user: User, return_url: str) -> str:
        """Create a Stripe Customer Portal session for subscription management"""
        if not user.stripe_customer_id:
            raise ValueError("User does not have a Stripe customer ID")

        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )

        return portal_session.url

    @staticmethod
    def handle_webhook_event(db: Session, payload: bytes, sig_header: str) -> dict:
        """Handle incoming Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")

        event_type = event["type"]
        data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            return StripeService._handle_checkout_completed(db, data)
        elif event_type == "customer.subscription.updated":
            return StripeService._handle_subscription_updated(db, data)
        elif event_type == "customer.subscription.deleted":
            return StripeService._handle_subscription_deleted(db, data)
        elif event_type == "invoice.payment_succeeded":
            return StripeService._handle_payment_succeeded(db, data)
        elif event_type == "invoice.payment_failed":
            return StripeService._handle_payment_failed(db, data)

        return {"status": "ignored", "event_type": event_type}

    @staticmethod
    def _handle_checkout_completed(db: Session, session: dict) -> dict:
        """Handle successful checkout completion"""
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        metadata = session.get("metadata", {})
        tier = metadata.get("tier")

        if not customer_id:
            return {"status": "error", "message": "No customer ID in session"}

        # Find user by stripe_customer_id
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()

        if not user:
            # Try to find by user_id in metadata
            user_id = metadata.get("user_id")
            if user_id:
                user = db.query(User).filter(User.id == int(user_id)).first()
                if user:
                    user.stripe_customer_id = customer_id

        if not user:
            return {"status": "error", "message": "User not found"}

        # Update user subscription
        if tier:
            user.subscription_tier = SubscriptionTier(tier)
        user.stripe_subscription_id = subscription_id

        from datetime import datetime

        user.subscription_updated_at = datetime.utcnow()

        db.commit()

        return {
            "status": "success",
            "event": "checkout_completed",
            "user_id": user.id,
            "tier": tier,
        }

    @staticmethod
    def _handle_subscription_updated(db: Session, subscription: dict) -> dict:
        """Handle subscription update (upgrade/downgrade)"""
        customer_id = subscription.get("customer")
        subscription_id = subscription.get("id")
        status = subscription.get("status")

        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()

        if not user:
            return {"status": "error", "message": "User not found"}

        if status == "active":
            # Get the current price to determine tier
            items = subscription.get("items", {}).get("data", [])
            if items:
                price_id = items[0].get("price", {}).get("id")
                new_tier = StripeService.PRICE_ID_TO_TIER.get(price_id)
                if new_tier:
                    user.subscription_tier = new_tier
                    user.stripe_subscription_id = subscription_id

                    from datetime import datetime

                    user.subscription_updated_at = datetime.utcnow()

                    db.commit()

                    return {
                        "status": "success",
                        "event": "subscription_updated",
                        "user_id": user.id,
                        "tier": new_tier.value,
                    }

        return {"status": "processed", "event": "subscription_updated"}

    @staticmethod
    def _handle_subscription_deleted(db: Session, subscription: dict) -> dict:
        """Handle subscription cancellation"""
        customer_id = subscription.get("customer")

        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()

        if not user:
            return {"status": "error", "message": "User not found"}

        # Downgrade to free tier
        user.subscription_tier = SubscriptionTier.FREE
        user.stripe_subscription_id = None

        from datetime import datetime

        user.subscription_updated_at = datetime.utcnow()

        db.commit()

        return {
            "status": "success",
            "event": "subscription_deleted",
            "user_id": user.id,
            "tier": "free",
        }

    @staticmethod
    def _handle_payment_succeeded(db: Session, invoice: dict) -> dict:
        """Handle successful payment"""
        customer_id = invoice.get("customer")

        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()

        if user:
            return {
                "status": "success",
                "event": "payment_succeeded",
                "user_id": user.id,
            }

        return {"status": "processed", "event": "payment_succeeded"}

    @staticmethod
    def _handle_payment_failed(db: Session, invoice: dict) -> dict:
        """Handle failed payment - could send notification email here"""
        customer_id = invoice.get("customer")

        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()

        if user:
            # Could send email notification about failed payment
            return {
                "status": "success",
                "event": "payment_failed",
                "user_id": user.id,
            }

        return {"status": "processed", "event": "payment_failed"}

    @staticmethod
    def get_subscription_status(db: Session, user: User) -> dict:
        """Get current subscription status from Stripe"""
        if not user.stripe_subscription_id:
            return {
                "status": "inactive",
                "tier": user.subscription_tier.value,
                "cancel_at_period_end": False,
                "current_period_end": None,
            }

        try:
            subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)

            # Safely access subscription attributes
            status = getattr(subscription, "status", "unknown")
            cancel_at_period_end = getattr(subscription, "cancel_at_period_end", False)
            current_period_end = getattr(subscription, "current_period_end", None)

            return {
                "status": status,
                "tier": user.subscription_tier.value,
                "cancel_at_period_end": cancel_at_period_end,
                "current_period_end": current_period_end,
            }
        except stripe.error.StripeError as e:
            # Log the error for debugging
            print(f"Stripe error fetching subscription: {e}")
            return {
                "status": "error",
                "tier": user.subscription_tier.value,
                "cancel_at_period_end": False,
                "current_period_end": None,
            }
        except Exception as e:
            # Handle any other unexpected errors
            print(f"Unexpected error fetching subscription: {e}")
            return {
                "status": "error",
                "tier": user.subscription_tier.value,
                "cancel_at_period_end": False,
                "current_period_end": None,
            }

    @staticmethod
    def cancel_subscription(db: Session, user: User, immediate: bool = False) -> dict:
        """Cancel a subscription - either immediately or at period end"""
        if not user.stripe_subscription_id:
            raise ValueError("No active subscription to cancel")

        try:
            if immediate:
                # Cancel immediately
                subscription = stripe.Subscription.cancel(user.stripe_subscription_id)

                # Update user to free tier
                user.subscription_tier = SubscriptionTier.FREE
                user.stripe_subscription_id = None

                from datetime import datetime

                user.subscription_updated_at = datetime.utcnow()
                db.commit()

                return {
                    "status": "canceled",
                    "message": "Subscription canceled immediately",
                    "tier": "free",
                }
            else:
                # Cancel at period end
                subscription = stripe.Subscription.modify(user.stripe_subscription_id, cancel_at_period_end=True)

                current_period_end = getattr(subscription, "current_period_end", None)

                return {
                    "status": "pending_cancellation",
                    "message": "Subscription will be canceled at the end of the billing period",
                    "cancel_at": current_period_end,
                }
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to cancel subscription: {str(e)}")

    @staticmethod
    def reactivate_subscription(db: Session, user: User) -> dict:
        """Reactivate a subscription that was set to cancel at period end"""
        if not user.stripe_subscription_id:
            raise ValueError("No subscription to reactivate")

        try:

            return {
                "status": "active",
                "message": "Subscription reactivated successfully",
            }
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to reactivate subscription: {str(e)}")

    @staticmethod
    def switch_subscription(db: Session, user: User, new_tier: str) -> dict:
        """Switch subscription to a different tier (upgrade or downgrade)"""
        if new_tier not in StripeService.TIER_TO_PRICE_ID:
            raise ValueError(f"Invalid tier: {new_tier}. Must be 'plus' or 'pro'")

        if not user.stripe_subscription_id:
            raise ValueError("No active subscription to switch. Please subscribe first.")

        try:
            # Get the current subscription
            subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)

            # Check if subscription is canceled or inactive
            sub_status = getattr(subscription, "status", "unknown")
            if sub_status in ["canceled", "incomplete_expired", "unpaid"]:
                # Subscription is canceled - need to create a new one
                raise ValueError(
                    f"Your subscription is {sub_status}. Please create a new subscription instead of switching."
                )

            # Check if it's set to cancel at period end
            if getattr(subscription, "cancel_at_period_end", False):
                # First reactivate, then switch
                stripe.Subscription.modify(user.stripe_subscription_id, cancel_at_period_end=False)
                # Re-fetch the subscription
                subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)

            # Get the current subscription item ID
            items_data = subscription.get("items", {})
            if isinstance(items_data, dict):
                items_list = items_data.get("data", [])
            else:
                items_list = getattr(items_data, "data", [])

            if not items_list:
                raise ValueError("Could not find subscription items")

            # Update user's tier
            user.subscription_tier = SubscriptionTier(new_tier)

            from datetime import datetime

            user.subscription_updated_at = datetime.utcnow()
            db.commit()

            return {
                "status": "success",
                "message": f"Subscription switched to {new_tier.upper()} plan",
                "tier": new_tier,
            }
        except stripe.error.InvalidRequestError as e:
            # Handle specific Stripe errors
            error_message = str(e)
            if "canceled" in error_message.lower():
                raise ValueError("Your subscription has been canceled. Please create a new subscription.")
            raise ValueError(f"Failed to switch subscription: {error_message}")
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to switch subscription: {str(e)}")


stripe_service = StripeService()
