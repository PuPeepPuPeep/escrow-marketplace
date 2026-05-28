from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.wallet import Wallet
from app.models.wallet_transaction import TransactionType, WalletTransaction
from app.models.withdrawal import Withdrawal, WithdrawalStatus


def get_wallet(db: Session, user_id: int) -> Wallet:
    wallet = db.execute(
        select(Wallet).where(Wallet.user_id == user_id)
    ).scalar_one_or_none()
    if wallet is None:
        raise ValueError("wallet not found")
    return wallet


def request_withdrawal(
    db: Session,
    user_id: int,
    amount: Decimal,
    bank_account: str,
    bank_name: str,
    account_name: str,
) -> Withdrawal:
    wallet = db.execute(
        select(Wallet).where(Wallet.user_id == user_id).with_for_update()
    ).scalar_one_or_none()

    if wallet is None:
        raise ValueError("wallet not found")
    if amount <= Decimal("0"):
        raise ValueError("amount must be positive")
    if wallet.balance < amount:
        raise ValueError("insufficient balance")

    wallet.balance -= amount
    db.add(WalletTransaction(
        wallet_id=wallet.id,
        type=TransactionType.WITHDRAW,
        amount=amount,
        balance_after=wallet.balance,
    ))

    withdrawal = Withdrawal(
        wallet_id=wallet.id,
        amount=amount,
        bank_account=bank_account,
        bank_name=bank_name,
        account_name=account_name,
        status=WithdrawalStatus.QUEUED,
    )
    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)
    return withdrawal
