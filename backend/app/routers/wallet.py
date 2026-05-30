from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_user
from app.models.user import User
from app.schemas.wallet import WalletResponse, WithdrawRequest, WithdrawalResponse
from app.services import wallet_service

router = APIRouter()


@router.get("", response_model=WalletResponse)
def get_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    try:
        wallet = wallet_service.get_wallet(db, current_user.id)
    except ValueError as e:
        raise HTTPException(404, str(e))
    return wallet


@router.post("/withdraw", response_model=WithdrawalResponse, status_code=201)
def withdraw(
    body: WithdrawRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    try:
        withdrawal = wallet_service.request_withdrawal(
            db=db,
            user_id=current_user.id,
            amount=body.amount,
            bank_account=body.bank_account,
            bank_name=body.bank_name,
            account_name=body.account_name,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return withdrawal
