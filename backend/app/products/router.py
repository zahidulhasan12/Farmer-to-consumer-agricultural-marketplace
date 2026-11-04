# HTTP API Router for agricultural products: declares REST endpoints, validates input, and delegates to service.
from typing import Annotated
from fastapi import APIRouter, Query, status

from app.products.dependencies import ProductDep, ServiceDep
from app.products.models import Product
from app.products.schemas import ProductCreate, ProductPage, ProductRead, ProductUpdate

router = APIRouter(tags=["products"])


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, service: ServiceDep) -> Product:
    """Create a new agricultural product listing."""
    return service.create_product(data)


@router.get("", response_model=ProductPage)
def list_products(
    service: ServiceDep,
    offset: Annotated[int, Query(ge=0, description="Pagination offset")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 50,
    search: Annotated[str | None, Query(description="Search by name, farmer, or description")] = None,
    category: Annotated[str | None, Query(description="Filter by category (e.g. Vegetables, Fruits, Grains, Dairy)")] = None,
) -> ProductPage:
    """List all agricultural products with optional filtering and pagination."""
    return service.list_products(offset=offset, limit=limit, search=search, category=category)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product: ProductDep) -> Product:
    """Retrieve details of a single product by its unique UUID."""
    return product


@router.put("/{product_id}", response_model=ProductRead)
@router.patch("/{product_id}", response_model=ProductRead)
def update_product(product: ProductDep, data: ProductUpdate, service: ServiceDep) -> Product:
    """Update fields of an existing product (price, quantity, category, description, availability, etc.)."""
    return service.update_product(product, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product: ProductDep, service: ServiceDep) -> None:
    """Delete a product listing by its unique UUID."""
    service.delete_product(product)
