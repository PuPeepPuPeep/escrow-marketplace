from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("deals.id"), nullable=False)
    slip_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verify_status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    verified_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    deal: Mapped["Deal"] = relationship("Deal", back_populates="payments")

    __table_args__ = (
        # Idempotency guard: only one VERIFIED payment per deal allowed at DB level
        Index(
            "uix_payments_deal_verified",
            "deal_id",
            unique=True,
            postgresql_where="verify_status = 'VERIFIED'",
        ),
    )
