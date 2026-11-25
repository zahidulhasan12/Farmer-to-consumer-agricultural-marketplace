# Database models for User accounts and JWT Refresh Token sessions in SQLite/PostgreSQL.
import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    name: str = Field(max_length=150)
    role: str = Field(default="FARMER", max_length=50)  # "FARMER", "CONSUMER", "ADMIN"
    phone: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default="Bogura", max_length=150)
    is_banned: bool = Field(default=False)
    failed_login_attempts: int = Field(default=0)
    locked_until: datetime | None = Field(default=None)
    is_main_admin: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(unique=True, index=True, max_length=128)
    expires_at: datetime = Field(index=True)
    is_revoked: bool = Field(default=False, index=True)
    user_agent: str | None = Field(default=None, max_length=500)
    ip_address: str | None = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=utc_now)
