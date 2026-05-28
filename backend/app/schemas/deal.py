from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.deal import DealStatus


class CreateDealRequest(BaseModel):
    title: str
    amount: Decimal
    gp_fee_percent: Decimal | None = None
    lock_duration_minutes: int = 30


class PayRequest(BaseModel):
    slip_image_url: str | None = None
    force_result: str | None = None  # for testing: "VERIFIED" | "FAILED"


class DealResponse(BaseModel):
    id: int
    title: str
    amount: Decimal
    gp_fee_percent: Decimal
    status: DealStatus
    unique_token: str
    lock_duration_minutes: int
    locked_at: datetime | None
    expires_at: datetime | None
    seller_id: int
    buyer_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
