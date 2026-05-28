from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class WalletTransactionResponse(BaseModel):
    id: int
    type: str
    amount: Decimal
    balance_after: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletResponse(BaseModel):
    id: int
    balance: Decimal
    transactions: list[WalletTransactionResponse] = []

    model_config = {"from_attributes": True}


class WithdrawRequest(BaseModel):
    amount: Decimal
    bank_account: str
    bank_name: str
    account_name: str


class WithdrawalResponse(BaseModel):
    id: int
    amount: Decimal
    status: str
    bank_account: str
    bank_name: str
    account_name: str
    requested_at: datetime
    paid_out_at: datetime | None

    model_config = {"from_attributes": True}
