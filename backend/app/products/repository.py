# Data access layer for products: handles SQL queries using SQLModel.
import uuid
from sqlmodel import Session, col, func, or_, select

from app.products.models import Product


class ProductRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(
        self,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
        category: str | None = None,
    ) -> list[Product]:
        statement = select(Product)

        if category and category.lower() != "all":
            statement = statement.where(func.lower(Product.category) == category.lower())

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            statement = statement.where(
                or_(
                    func.lower(Product.name).like(term),
                    func.lower(Product.farmer_name).like(term),
                    func.lower(Product.farmer_location).like(term),
                    func.lower(Product.description).like(term),
                )
            )

        statement = statement.order_by(col(Product.created_at).desc(), col(Product.id).desc()).offset(offset).limit(limit)
        return list(self.session.exec(statement).all())

    def count(self, search: str | None = None, category: str | None = None) -> int:
        statement = select(func.count()).select_from(Product)

        if category and category.lower() != "all":
            statement = statement.where(func.lower(Product.category) == category.lower())

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            statement = statement.where(
                or_(
                    func.lower(Product.name).like(term),
                    func.lower(Product.farmer_name).like(term),
                    func.lower(Product.farmer_location).like(term),
                    func.lower(Product.description).like(term),
                )
            )

        return self.session.exec(statement).one()

    def get(self, product_id: uuid.UUID) -> Product | None:
        return self.session.get(Product, product_id)

    def create(self, product: Product) -> Product:
        return self._save(product)

    def update(self, product: Product, patch: dict) -> Product:
        product.sqlmodel_update(patch)
        return self._save(product)

    def delete(self, product: Product) -> None:
        self.session.delete(product)
        self.session.commit()

    def _save(self, product: Product) -> Product:
        self.session.add(product)
        self.session.commit()
        self.session.refresh(product)
        return product
