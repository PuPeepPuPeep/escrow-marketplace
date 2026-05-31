from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://escrow:escrow@db:5432/escrow"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24h
    gp_fee_percent: float = 3.0
    deal_lock_duration_minutes: int = 30
    escrow_bank_name: str = "Kasikorn Bank (KBank)"
    escrow_account_number: str = "123-4-56789-0"
    escrow_account_name: str = "Escrow Marketplace Co., Ltd."

    class Config:
        env_file = ".env"


settings = Settings()
