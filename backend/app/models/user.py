from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="user", uselist=False)
    deals_as_seller: Mapped[list["Deal"]] = relationship("Deal", foreign_keys="Deal.seller_id", back_populates="seller")
    deals_as_buyer: Mapped[list["Deal"]] = relationship("Deal", foreign_keys="Deal.buyer_id", back_populates="buyer")
