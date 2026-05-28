from fastapi import APIRouter
from pydantic import BaseModel

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
