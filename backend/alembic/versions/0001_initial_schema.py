"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="buyer"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "wallets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("balance", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "deals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("buyer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("gp_fee_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("status", sa.Enum("CREATED", "LOCKED", "PAID", "DONE", "EXPIRED", "CANCELLED", name="dealstatus"), nullable=False, server_default="CREATED"),
        sa.Column("unique_token", sa.String(64), nullable=False, unique=True),
        sa.Column("lock_duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_deals_unique_token", "deals", ["unique_token"])

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("deal_id", sa.Integer(), sa.ForeignKey("deals.id"), nullable=False),
        sa.Column("slip_image_url", sa.String(500), nullable=True),
        sa.Column("verify_status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("verified_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    # Idempotency: only one VERIFIED payment per deal
    op.execute(
        "CREATE UNIQUE INDEX uix_payments_deal_verified ON payments(deal_id) "
        "WHERE verify_status = 'VERIFIED'"
    )

    op.create_table(
        "wallet_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("wallet_id", sa.Integer(), sa.ForeignKey("wallets.id"), nullable=False),
        sa.Column("deal_id", sa.Integer(), sa.ForeignKey("deals.id"), nullable=True),
        sa.Column("type", sa.Enum("CREDIT", "DEBIT", "WITHDRAW", name="transactiontype"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("balance_after", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "withdrawals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("wallet_id", sa.Integer(), sa.ForeignKey("wallets.id"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.Enum("QUEUED", "PAID_OUT", name="withdrawalstatus"), nullable=False, server_default="QUEUED"),
        sa.Column("bank_account", sa.String(100), nullable=False),
        sa.Column("bank_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("account_name", sa.String(200), nullable=False, server_default=""),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("paid_out_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("deal_id", sa.Integer(), sa.ForeignKey("deals.id"), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("withdrawals")
    op.execute("DROP TYPE IF EXISTS withdrawalstatus")
    op.drop_table("wallet_transactions")
    op.execute("DROP TYPE IF EXISTS transactiontype")
    op.execute("DROP INDEX IF EXISTS uix_payments_deal_verified")
    op.drop_table("payments")
    op.drop_table("deals")
    op.execute("DROP TYPE IF EXISTS dealstatus")
    op.drop_table("wallets")
    op.drop_table("users")
