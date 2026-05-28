from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class DealAdminResponse(BaseModel):
    id: int
    title: str
    amount: Decimal
    gp_fee_percent: Decimal
    status: str
    seller_id: int
    buyer_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StatsResponse(BaseModel):
    total_deals: int
    total_volume: Decimal
    total_fees_collected: Decimal
    pending_withdrawals: int
    pending_withdrawal_amount: Decimal


class WithdrawalAdminResponse(BaseModel):
    id: int
    wallet_id: int
    amount: Decimal
    status: str
    bank_account: str
    bank_name: str
    account_name: str
    requested_at: datetime
    paid_out_at: datetime | None

    model_config = {"from_attributes": True}
