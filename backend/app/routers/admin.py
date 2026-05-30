from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.models.deal import Deal, DealStatus
from app.models.user import User
from app.models.withdrawal import Withdrawal, WithdrawalStatus
from app.schemas.admin import DealAdminResponse, StatsResponse, WithdrawalAdminResponse
from app.services.export_service import generate_withdrawal_csv

router = APIRouter()


@router.get("/deals", response_model=list[DealAdminResponse])
def list_deals(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    deals = db.execute(
        select(Deal).order_by(Deal.created_at.desc()).offset(skip).limit(limit)
    ).scalars().all()
    return deals


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_deals = db.execute(select(func.count(Deal.id))).scalar() or 0

    done_deals = db.execute(
        select(Deal).where(Deal.status == DealStatus.DONE)
    ).scalars().all()
    total_volume = sum(d.amount for d in done_deals) or Decimal("0")
    total_fees = sum(d.amount * d.gp_fee_percent / Decimal("100") for d in done_deals) or Decimal("0")

    pending_w = db.execute(
        select(Withdrawal).where(Withdrawal.status == WithdrawalStatus.QUEUED)
    ).scalars().all()
    pending_count = len(pending_w)
    pending_amount = sum(w.amount for w in pending_w) or Decimal("0")

    return StatsResponse(
        total_deals=total_deals,
        total_volume=total_volume,
        total_fees_collected=total_fees,
        pending_withdrawals=pending_count,
        pending_withdrawal_amount=pending_amount,
    )


@router.get("/withdrawals", response_model=list[WithdrawalAdminResponse])
def list_withdrawals(
    status: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(Withdrawal).order_by(Withdrawal.requested_at.desc())
    if status:
        q = q.where(Withdrawal.status == status.upper())
    withdrawals = db.execute(q).scalars().all()
    return withdrawals


@router.get("/withdrawals/export")
def export_withdrawals(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return StreamingResponse(
        generate_withdrawal_csv(db),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=withdrawals.csv"},
    )


@router.post("/withdrawals/{withdrawal_id}/payout", response_model=WithdrawalAdminResponse)
def mark_payout(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from datetime import datetime, timezone

    withdrawal = db.get(Withdrawal, withdrawal_id)
    if not withdrawal:
        raise HTTPException(404, "withdrawal not found")
    if withdrawal.status != WithdrawalStatus.QUEUED:
        raise HTTPException(400, "withdrawal is not in QUEUED status")

    withdrawal.status = WithdrawalStatus.PAID_OUT
    withdrawal.paid_out_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(withdrawal)
    return withdrawal
