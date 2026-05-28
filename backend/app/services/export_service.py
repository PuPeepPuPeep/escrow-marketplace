import csv
import io
from typing import Generator

from sqlalchemy.orm import Session

from app.models.withdrawal import Withdrawal, WithdrawalStatus


def generate_withdrawal_csv(db: Session) -> Generator[str, None, None]:
    """Stream withdrawal queue as CSV rows (bank bulk transfer format)."""
    queued = (
        db.query(Withdrawal)
        .filter(Withdrawal.status == WithdrawalStatus.QUEUED)
        .order_by(Withdrawal.requested_at)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "bank_account", "bank_name", "account_name", "amount", "requested_at"])
    yield output.getvalue()
    output.truncate(0)
    output.seek(0)

    for w in queued:
        writer.writerow([
            w.id,
            w.bank_account,
            w.bank_name,
            w.account_name,
            str(w.amount),
            w.requested_at.isoformat(),
        ])
        yield output.getvalue()
        output.truncate(0)
        output.seek(0)
