# Database model for agricultural products; mapped to the `product` table.
import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Product(SQLModel, table=True):
    __tablename__ = "products"

    # UUID primary key: unguessable and portable across SQLite and Supabase PostgreSQL.
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    name: str = Field(index=True, max_length=150)
    category: str = Field(index=True, max_length=50)
    price: float = Field(ge=0.0)
    unit: str = Field(default="kg", max_length=30)
    quantity: int = Field(default=0, ge=0)
    description: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=1000)
    farmer_name: str = Field(index=True, max_length=100)
    farmer_location: str = Field(default="Bogura", max_length=100)
    farmer_phone: str | None = Field(default=None, max_length=30)
    is_available: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
