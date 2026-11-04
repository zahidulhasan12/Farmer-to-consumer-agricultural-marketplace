# Per-request dependency injection for products: builds session -> repository -> service, and validates product ID.
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.database import SessionDep
from app.products.models import Product
from app.products.repository import ProductRepository
from app.products.service import ProductService


def get_product_service(session: SessionDep) -> ProductService:
    return ProductService(ProductRepository(session))


ServiceDep = Annotated[ProductService, Depends(get_product_service)]


def valid_product(product_id: uuid.UUID, service: ServiceDep) -> Product:
    product = service.get_product(product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' was not found",
        )
    return product


ProductDep = Annotated[Product, Depends(valid_product)]
