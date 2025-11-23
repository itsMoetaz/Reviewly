from typing import Dict

from pydantic import BaseModel


class UsageStatsResponse(BaseModel):

    tier: str
    ai_reviews: Dict[str, int | bool]
    resets_at: str


class SubscriptionChangeRequest(BaseModel):

    tier: str


class SubscriptionChangeResponse(BaseModel):

    message: str
    tier: str
    updated_at: str | None


class SubscriptionPlan(BaseModel):

    tier: str
    name: str
    price: int
    ai_reviews_per_month: int
    description: str


class SubscriptionPlansResponse(BaseModel):

    plans: list[SubscriptionPlan]
