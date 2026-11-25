# Pydantic / SQLModel schemas for Cooperative Groups and Membership.
import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field

GroupPermission = Literal["ADMIN", "CAN_ADD_PRODUCTS", "VIEW_ONLY"]


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=1000)


class GroupMemberAdd(BaseModel):
    email: EmailStr
    permission: GroupPermission = "CAN_ADD_PRODUCTS"


class GroupMemberRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    name: str
    role: str
    permission: str
    joined_at: datetime


class GroupRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    owner_id: uuid.UUID
    owner_name: str | None = None
    my_permission: str | None = None
    created_at: datetime
    members_count: int = 0
    members: list[GroupMemberRead] | None = None
