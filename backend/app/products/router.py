# HTTP API Router for agricultural products: declares REST endpoints, validates input, and enforces ownership and RBAC.
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.admin.audit import log_audit_event
from app.auth.dependencies import CurrentUserDep, get_current_user_optional
from app.auth.models import User
from app.products.dependencies import ProductDep, ServiceDep
from app.products.models import Product
from app.products.schemas import ProductCreate, ProductPage, ProductRead, ProductUpdate

router = APIRouter(tags=["products"])


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    current_user: CurrentUserDep,
    service: ServiceDep,
    request: Request,
) -> Product:
    """Create a new agricultural product listing (Restricted to Farmers and Admins)."""
    if current_user.role == "CONSUMER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered farmers and administrators can list products for sale.",
        )

    # Auto-fill farmer metadata if not explicitly provided
    if not data.farmer_name or not data.farmer_name.strip():
        data.farmer_name = current_user.name
    if (not data.farmer_location or not data.farmer_location.strip()) and current_user.location:
        data.farmer_location = current_user.location
    if not data.farmer_phone and current_user.phone:
        data.farmer_phone = current_user.phone

    created = service.create_product(data, owner_id=current_user.id)

    ip = request.client.host if request.client else None
    log_audit_event(
        service.repo.session,
        action="PRODUCT_CREATED",
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=ip,
        details=f"Listed product '{created.name}' (৳{created.price}/{created.unit}, Stock: {created.quantity})",
    )

    return created


@router.get("", response_model=ProductPage)
def list_products(
    service: ServiceDep,
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    offset: Annotated[int, Query(ge=0, description="Pagination offset")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 50,
    search: Annotated[str | None, Query(description="Search by name, farmer, or description")] = None,
    category: Annotated[str | None, Query(description="Filter by category")] = None,
    owner_id: Annotated[uuid.UUID | None, Query(description="Filter by owner UUID")] = None,
    mine: Annotated[bool, Query(description="If true, returns only products owned by logged-in user")] = False,
) -> ProductPage:
    """List agricultural products with optional search, category, and ownership filtering."""
    if mine:
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to view your listed products.",
            )
        owner_id = current_user.id

    return service.list_products(
        offset=offset,
        limit=limit,
        search=search,
        category=category,
        owner_id=owner_id,
    )


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product: ProductDep) -> Product:
    """Retrieve details of a single product by its unique UUID."""
    return product


@router.put("/{product_id}", response_model=ProductRead)
@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product: ProductDep,
    data: ProductUpdate,
    current_user: CurrentUserDep,
    service: ServiceDep,
    request: Request,
) -> Product:
    """Update fields of an existing product (Owner or Admin only)."""
    if not service.check_ownership(product, current_user.id, current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this product. Only the owner or an administrator can update it.",
        )
    updated = service.update_product(product, data)

    ip = request.client.host if request.client else None
    log_audit_event(
        service.repo.session,
        action="PRODUCT_UPDATED",
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=ip,
        details=f"Updated product '{updated.name}' (ID: {updated.id})",
    )

    return updated


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product: ProductDep,
    current_user: CurrentUserDep,
    service: ServiceDep,
    request: Request,
) -> None:
    """Delete a product listing (Owner or Admin only)."""
    if not service.check_ownership(product, current_user.id, current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this product. Only the owner or an administrator can delete it.",
        )
    service.delete_product(product)

    ip = request.client.host if request.client else None
    log_audit_event(
        service.repo.session,
        action="PRODUCT_DELETED",
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=ip,
        details=f"Deleted product '{product.name}' (ID: {product.id})",
    )
