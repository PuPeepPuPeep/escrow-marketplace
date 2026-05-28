import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.deal import Deal, DealStatus
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.wallet import Wallet
from app.models.wallet_transaction import TransactionType, WalletTransaction
from app.services.scheduler_service import get_scheduler

logger = logging.getLogger(__name__)


def _notify(db: Session, deal_id: int, event_type: str) -> None:
    db.add(Notification(deal_id=deal_id, event_type=event_type))


def create_deal(db: Session, seller_id: int, title: str, amount, gp_fee_percent=None, lock_duration_minutes: int = 30) -> Deal:
    if gp_fee_percent is None:
        gp_fee_percent = settings.gp_fee_percent

    deal = Deal(
        seller_id=seller_id,
        title=title,
        amount=amount,
        gp_fee_percent=gp_fee_percent,
        lock_duration_minutes=lock_duration_minutes,
        unique_token=secrets.token_urlsafe(16),
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    _notify(db, deal.id, "CREATED")
    db.commit()
    return deal


def accept_deal(db: Session, token: str, buyer_id: int) -> Deal:
    deal = db.execute(
        select(Deal).where(Deal.unique_token == token).with_for_update()
    ).scalar_one_or_none()

    if deal is None:
        raise ValueError("deal not found")
    if deal.status != DealStatus.CREATED:
        raise ValueError("deal is not available for acceptance")
    if deal.seller_id == buyer_id:
        raise ValueError("seller cannot be buyer of own deal")

    now = datetime.now(timezone.utc)
    deal.buyer_id = buyer_id
    deal.status = DealStatus.LOCKED
    deal.locked_at = now
    deal.expires_at = now + timedelta(minutes=deal.lock_duration_minutes)
    db.commit()

    _schedule_expiry(deal.id, deal.expires_at)
    _notify(db, deal.id, "LOCKED")
    db.commit()
    db.refresh(deal)
    return deal


def _schedule_expiry(deal_id: int, expires_at: datetime) -> None:
    scheduler = get_scheduler()
    job_id = f"expire_deal_{deal_id}"
    scheduler.add_job(
        expire_deal_job,
        trigger="date",
        run_date=expires_at,
        args=[deal_id],
        id=job_id,
        replace_existing=True,
    )


def expire_deal_job(deal_id: int) -> None:
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        deal = db.execute(
            select(Deal).where(Deal.id == deal_id).with_for_update()
        ).scalar_one_or_none()
        if deal and deal.status == DealStatus.LOCKED:
            deal.status = DealStatus.EXPIRED
            _notify(db, deal.id, "EXPIRED")
            db.commit()
            logger.info("deal %s expired", deal_id)
    finally:
        db.close()


def recover_expired_deals() -> None:
    """Called on startup: expire any LOCKED deals whose countdown already passed."""
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        stale = db.execute(
            select(Deal).where(
                Deal.status == DealStatus.LOCKED,
                Deal.expires_at < now,
            )
        ).scalars().all()
        for deal in stale:
            deal.status = DealStatus.EXPIRED
            _notify(db, deal.id, "EXPIRED")
            logger.info("startup recovery: expired deal %s", deal.id)
        if stale:
            db.commit()
    finally:
        db.close()


def pay_deal(db: Session, deal_id: int, buyer_id: int, slip_image_url: str | None, verify_result: str) -> Deal:
    deal = db.execute(
        select(Deal).where(Deal.id == deal_id).with_for_update()
    ).scalar_one_or_none()

    if deal is None:
        raise ValueError("deal not found")
    if deal.buyer_id != buyer_id:
        raise ValueError("only the buyer can submit payment")
    if deal.status != DealStatus.LOCKED:
        raise ValueError("deal must be LOCKED to accept payment")

    now = datetime.now(timezone.utc)
    if deal.expires_at and now > deal.expires_at:
        deal.status = DealStatus.EXPIRED
        db.commit()
        raise ValueError("deal has expired")

    # Check idempotency: already have a verified payment?
    existing = db.execute(
        select(Payment).where(
            Payment.deal_id == deal_id,
            Payment.verify_status == "VERIFIED",
        )
    ).scalar_one_or_none()
    if existing:
        raise ValueError("payment already verified for this deal")

    payment = Payment(
        deal_id=deal_id,
        slip_image_url=slip_image_url,
        verify_status=verify_result,
        verified_amount=deal.amount if verify_result == "VERIFIED" else None,
        verified_at=now if verify_result == "VERIFIED" else None,
    )
    db.add(payment)

    if verify_result == "VERIFIED":
        deal.status = DealStatus.PAID
        _notify(db, deal.id, "PAID")

    db.commit()
    db.refresh(deal)
    return deal


def confirm_deal(db: Session, deal_id: int, buyer_id: int) -> Deal:
    deal = db.execute(
        select(Deal).where(Deal.id == deal_id).with_for_update()
    ).scalar_one_or_none()

    if deal is None:
        raise ValueError("deal not found")
    if deal.buyer_id != buyer_id:
        raise ValueError("only the buyer can confirm receipt")
    if deal.status != DealStatus.PAID:
        raise ValueError("deal must be PAID to confirm")

    wallet = db.execute(
        select(Wallet).where(Wallet.user_id == deal.seller_id).with_for_update()
    ).scalar_one()

    from decimal import Decimal
    net = deal.amount - (deal.amount * deal.gp_fee_percent / Decimal("100"))
    wallet.balance += net
    db.add(WalletTransaction(
        wallet_id=wallet.id,
        deal_id=deal.id,
        type=TransactionType.CREDIT,
        amount=net,
        balance_after=wallet.balance,
    ))

    deal.status = DealStatus.DONE
    _notify(db, deal.id, "DONE")
    db.commit()
    db.refresh(deal)
    return deal


def cancel_deal(db: Session, deal_id: int, requesting_user_id: int, requesting_role: str) -> Deal:
    deal = db.execute(
        select(Deal).where(Deal.id == deal_id).with_for_update()
    ).scalar_one_or_none()

    if deal is None:
        raise ValueError("deal not found")

    if deal.status in (DealStatus.PAID, DealStatus.DONE):
        raise ValueError("cannot cancel a deal that is PAID or DONE")

    if deal.status == DealStatus.LOCKED and requesting_role != "admin":
        raise ValueError("only admin can cancel a LOCKED deal")

    if deal.status == DealStatus.CREATED and deal.seller_id != requesting_user_id and requesting_role != "admin":
        raise ValueError("only the seller or admin can cancel this deal")

    deal.status = DealStatus.CANCELLED
    _notify(db, deal.id, "CANCELLED")
    db.commit()
    db.refresh(deal)
    return deal
