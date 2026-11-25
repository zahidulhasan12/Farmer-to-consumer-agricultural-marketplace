# Repository for User and RefreshToken database operations.
import uuid
from datetime import datetime, timezone
from sqlmodel import Session, col, func, select

from app.auth.models import RefreshToken, User


class AuthRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    # --- User operations ---
    def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.session.get(User, user_id)

    def get_user_by_email(self, email: str) -> User | None:
        statement = select(User).where(func.lower(User.email) == email.lower().strip())
        return self.session.exec(statement).first()

    def create_user(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update_user(self, user: User) -> User:
        user.updated_at = datetime.now(timezone.utc)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def list_users(self, offset: int = 0, limit: int = 50) -> list[User]:
        statement = select(User).order_by(col(User.created_at).desc()).offset(offset).limit(limit)
        return list(self.session.exec(statement).all())

    def count_users(self) -> int:
        statement = select(func.count()).select_from(User)
        return self.session.exec(statement).one()

    # --- RefreshToken operations ---
    def create_refresh_token(self, token: RefreshToken) -> RefreshToken:
        self.session.add(token)
        self.session.commit()
        self.session.refresh(token)
        return token

    def get_refresh_token_by_hash(self, token_hash: str) -> RefreshToken | None:
        statement = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return self.session.exec(statement).first()

    def revoke_refresh_token(self, token_hash: str) -> None:
        token = self.get_refresh_token_by_hash(token_hash)
        if token:
            token.is_revoked = True
            self.session.add(token)
            self.session.commit()

    def revoke_all_user_tokens(self, user_id: uuid.UUID) -> None:
        statement = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False,
        )
        tokens = self.session.exec(statement).all()
        for token in tokens:
            token.is_revoked = True
            self.session.add(token)
        self.session.commit()
