# Database models for Farmer Cooperatives and Group Memberships.
import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Group(SQLModel, table=True):
    __tablename__ = "groups"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    name: str = Field(index=True, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=utc_now)


class GroupMember(SQLModel, table=True):
    __tablename__ = "group_members"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    group_id: uuid.UUID = Field(foreign_key="groups.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    permission: str = Field(default="VIEW_ONLY", max_length=50)  # "ADMIN", "CAN_ADD_PRODUCTS", "VIEW_ONLY"
    joined_at: datetime = Field(default_factory=utc_now)
