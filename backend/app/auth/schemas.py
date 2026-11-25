# Pydantic schemas for auth requests and responses.
import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


UserRole = Literal["FARMER", "CONSUMER", "ADMIN"]


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    phone: str | None = None
    location: str | None = None
    is_banned: bool = False
    is_main_admin: bool = False
    created_at: datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password must be at least 6 characters")
    name: str = Field(min_length=2, max_length=150)
    role: UserRole = Field(default="FARMER")
    phone: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default="Bogura", max_length=150)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    location: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead
