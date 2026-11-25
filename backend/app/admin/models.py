# Database model for System Security Audit Logging.
import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID | None = Field(default=None, index=True)
    user_email: str | None = Field(default=None, index=True, max_length=255)
    action: str = Field(index=True, max_length=50)
    ip_address: str | None = Field(default=None, max_length=100)
    user_agent: str | None = Field(default=None, max_length=500)
    details: str | None = Field(default=None, max_length=2000)
    created_at: datetime = Field(default_factory=utc_now, index=True)
