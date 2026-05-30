from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_user
from app.models.user import User
from app.schemas.deal import CreateDealRequest, DealResponse, PayRequest
from app.services import deal_service
from app.services.slip_service import mock_verify

router = APIRouter()


@router.get("/mine", response_model=list[DealResponse])
def get_my_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return deal_service.get_my_deals(db, seller_id=current_user.id)


@router.post("", response_model=DealResponse, status_code=201)
def create_deal(
    body: CreateDealRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    deal = deal_service.create_deal(
        db=db,
        seller_id=current_user.id,
        title=body.title,
        amount=body.amount,
        gp_fee_percent=body.gp_fee_percent,
        lock_duration_minutes=body.lock_duration_minutes,
    )
    return deal


@router.get("/{token}", response_model=DealResponse)
def get_deal(token: str, db: Session = Depends(get_db)):
    from sqlalchemy import select
    from app.models.deal import Deal

    deal = db.execute(select(Deal).where(Deal.unique_token == token)).scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "deal not found")
    return deal


@router.post("/{token}/accept", response_model=DealResponse)
def accept_deal(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    try:
        deal = deal_service.accept_deal(db=db, token=token, buyer_id=current_user.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return deal


@router.post("/{deal_id}/pay", response_model=DealResponse)
def pay_deal(
    deal_id: int,
    body: PayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    verify_result = mock_verify(body.force_result)
    try:
        deal = deal_service.pay_deal(
            db=db,
            deal_id=deal_id,
            buyer_id=current_user.id,
            slip_image_url=body.slip_image_url,
            verify_result=verify_result,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return deal


@router.post("/{deal_id}/confirm", response_model=DealResponse)
def confirm_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
):
    try:
        deal = deal_service.confirm_deal(db=db, deal_id=deal_id, buyer_id=current_user.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return deal


@router.post("/{deal_id}/cancel", response_model=DealResponse)
def cancel_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        deal = deal_service.cancel_deal(
            db=db,
            deal_id=deal_id,
            requesting_user_id=current_user.id,
            requesting_is_admin=current_user.is_admin,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return deal
