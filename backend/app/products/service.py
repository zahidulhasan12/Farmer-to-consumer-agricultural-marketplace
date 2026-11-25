# Business logic layer for agricultural products.
import uuid
from app.products.models import Product, utc_now
from app.products.repository import ProductRepository
from app.products.schemas import ProductCreate, ProductPage, ProductUpdate


class ProductRuleError(Exception):
    """Domain business rule violation (mapped to 409 Conflict / 400 Bad Request)."""


class ProductService:
    def __init__(self, repo: ProductRepository) -> None:
        self.repo = repo

    def list_products(
        self,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        category: str | None = None,
        owner_id: uuid.UUID | None = None,
    ) -> ProductPage:
        items = self.repo.list(offset=offset, limit=limit, search=search, category=category, owner_id=owner_id)
        total = self.repo.count(search=search, category=category, owner_id=owner_id)
        return ProductPage(items=items, total=total, offset=offset, limit=limit)

    def get_product(self, product_id: uuid.UUID) -> Product | None:
        return self.repo.get(product_id)

    def create_product(self, data: ProductCreate, owner_id: uuid.UUID | None = None) -> Product:
        self._validate_product_data(data.price, data.quantity)
        product = Product.model_validate(data)
        if owner_id is not None:
            product.user_id = owner_id
        return self.repo.create(product)

    def check_ownership(self, product: Product, user_id: uuid.UUID, user_role: str) -> bool:
        """Check if user has permission to modify product: must be Admin or the product's owner."""
        if user_role == "ADMIN":
            return True
        return product.user_id is not None and product.user_id == user_id

    def update_product(self, product: Product, data: ProductUpdate) -> Product:
        changes = data.model_dump(exclude_unset=True)
        if not changes:
            return product

        price = changes.get("price", product.price)
        quantity = changes.get("quantity", product.quantity)
        self._validate_product_data(price, quantity)

        changes["updated_at"] = utc_now()
        return self.repo.update(product, changes)

    def delete_product(self, product: Product) -> None:
        self.repo.delete(product)

    def _validate_product_data(self, price: float | None, quantity: int | None) -> None:
        if price is not None and price <= 0:
            raise ProductRuleError("Product price must be greater than zero")
        if quantity is not None and quantity < 0:
            raise ProductRuleError("Product stock quantity cannot be negative")
