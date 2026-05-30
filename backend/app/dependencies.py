from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    from app.models.user import User

    try:
        user_id = int(decode_token(token))
    except (ValueError, Exception):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found")
    return user


def require_admin(current_user=Depends(get_current_user)):
    """Allow only admin users."""
    if not current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "admin only")
    return current_user


def require_user(current_user=Depends(get_current_user)):
    """Allow only non-admin users (regular users)."""
    if current_user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "admin cannot perform user actions")
    return current_user
