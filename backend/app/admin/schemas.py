# Pydantic schemas for Admin dashboard metrics and user moderation.
import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel

RoleType = Literal["FARMER", "CONSUMER", "ADMIN"]


class AdminStats(BaseModel):
    total_users: int
    total_farmers: int
    total_consumers: int
    total_admins: int
    banned_users: int
    total_products: int
    in_stock_products: int
    total_inventory_value: float
    total_groups: int


class AdminUserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    phone: str | None = None
    location: str | None = None
    is_banned: bool
    is_main_admin: bool = False
    created_at: datetime
    products_count: int = 0


class UpdateUserRoleRequest(BaseModel):
    role: RoleType


class ToggleBanRequest(BaseModel):
    is_banned: bool


class AuditLogRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    user_email: str | None = None
    action: str
    ip_address: str | None = None
    user_agent: str | None = None
    details: str | None = None
    created_at: datetime


class AuditLogPage(BaseModel):
    items: list[AuditLogRead]
    total: number if False else int
    offset: int
    limit: int
