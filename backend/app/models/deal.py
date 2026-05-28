import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DealStatus(str, enum.Enum):
    CREATED = "CREATED"
    LOCKED = "LOCKED"
    PAID = "PAID"
    DONE = "DONE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    buyer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    gp_fee_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    status: Mapped[DealStatus] = mapped_column(
        Enum(DealStatus, name="dealstatus"), nullable=False, default=DealStatus.CREATED
    )
    unique_token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    lock_duration_minutes: Mapped[int] = mapped_column(nullable=False, default=30)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    seller: Mapped["User"] = relationship("User", foreign_keys=[seller_id], back_populates="deals_as_seller")
    buyer: Mapped["User | None"] = relationship("User", foreign_keys=[buyer_id], back_populates="deals_as_buyer")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="deal")
    wallet_transactions: Mapped[list["WalletTransaction"]] = relationship("WalletTransaction", back_populates="deal")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="deal")
