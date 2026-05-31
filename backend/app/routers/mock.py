from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.services.slip_service import mock_verify

router = APIRouter()


class SlipVerifyRequest(BaseModel):
    slip_image_url: str | None = None
    force_result: str | None = None


class SlipVerifyResponse(BaseModel):
    result: str
    message: str


@router.post("/slip-verify", response_model=SlipVerifyResponse)
def slip_verify(body: SlipVerifyRequest):
    result = mock_verify(body.force_result)
    return SlipVerifyResponse(
        result=result,
        message="Payment verified successfully" if result == "VERIFIED" else "Slip verification failed",
    )


class EscrowAccountResponse(BaseModel):
    bank_name: str
    account_number: str
    account_name: str


@router.get("/escrow-account", response_model=EscrowAccountResponse)
def get_escrow_account():
    return EscrowAccountResponse(
        bank_name=settings.escrow_bank_name,
        account_number=settings.escrow_account_number,
        account_name=settings.escrow_account_name,
    )
