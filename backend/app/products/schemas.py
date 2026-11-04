# Pydantic / SQLModel schemas for product requests and responses.
import uuid
from datetime import datetime, timezone
from typing import Annotated

from pydantic import StringConstraints, field_validator
from sqlmodel import Field, SQLModel

CleanString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
CategoryString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]


class ProductBase(SQLModel):
    name: CleanString
    category: CategoryString
    price: float = Field(ge=0.01, description="Price in BDT (৳)")
    unit: str = Field(default="kg", max_length=30)
    quantity: int = Field(ge=0, description="Available stock quantity")
    description: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=1000)
    farmer_name: CleanString
    farmer_location: str = Field(default="Bogura", max_length=100)
    farmer_phone: str | None = Field(default=None, max_length=30)
    is_available: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(SQLModel):
    name: CleanString | None = None
    category: CategoryString | None = None
    price: float | None = Field(default=None, ge=0.01)
    unit: str | None = None
    quantity: int | None = Field(default=None, ge=0)
    description: str | None = None
    image_url: str | None = None
    farmer_name: CleanString | None = None
    farmer_location: str | None = None
    farmer_phone: str | None = None
    is_available: bool | None = None

    @field_validator("name", "category", "farmer_name", "price", "quantity")
    @classmethod
    def not_null_if_provided(cls, value: object) -> object:
        if value is not None and isinstance(value, str) and not value.strip():
            raise ValueError("Field cannot be empty or blank")
        return value


class ProductRead(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    @field_validator("created_at", "updated_at")
    @classmethod
    def as_utc(cls, value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


class ProductPage(SQLModel):
    items: list[ProductRead]
    total: int
    offset: int
    limit: int
