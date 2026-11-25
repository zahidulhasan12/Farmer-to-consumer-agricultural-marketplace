# API Router for Administrator functions: System KPIs, User list, and moderation.
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from app.admin.schemas import (
    AdminStats,
    AdminUserRead,
    AuditLogPage,
    ToggleBanRequest,
    UpdateUserRoleRequest,
)
from app.admin.service import AdminRuleError, AdminService
from app.auth.dependencies import AdminUserDep
from app.auth.schemas import UserRead
from app.database import SessionDep

router = APIRouter(tags=["admin"])


def get_admin_service(session: SessionDep) -> AdminService:
    return AdminService(session)


AdminServiceDep = Annotated[AdminService, Depends(get_admin_service)]


@router.get("/stats", response_model=AdminStats)
def get_system_stats(
    _: AdminUserDep,
    service: AdminServiceDep,
) -> AdminStats:
    """Retrieve marketplace overview statistics (Admin only)."""
    return service.get_stats()


@router.get("/users", response_model=list[AdminUserRead])
def list_system_users(
    _: AdminUserDep,
    service: AdminServiceDep,
    search: Annotated[str | None, Query(description="Search users by name or email")] = None,
) -> list[AdminUserRead]:
    """List and search all registered users with their product count (Admin only)."""
    return service.list_users(search)


@router.patch("/users/{user_id}/ban", response_model=UserRead)
def toggle_user_ban(
    user_id: uuid.UUID,
    payload: ToggleBanRequest,
    current_admin: AdminUserDep,
    service: AdminServiceDep,
    request: Request,
) -> UserRead:
    """Suspend or reactivate a user account (Admin only)."""
    ip = request.client.host if request.client else None
    try:
        user = service.toggle_user_ban(current_admin, user_id, payload.is_banned, ip=ip)
        return UserRead(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            phone=user.phone,
            location=user.location,
            is_banned=user.is_banned,
            is_main_admin=user.is_main_admin,
            created_at=user.created_at,
        )
    except AdminRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.patch("/users/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: uuid.UUID,
    payload: UpdateUserRoleRequest,
    current_admin: AdminUserDep,
    service: AdminServiceDep,
    request: Request,
) -> UserRead:
    """Update role for a user account (Admin only)."""
    ip = request.client.host if request.client else None
    try:
        user = service.update_user_role(current_admin, user_id, payload.role, ip=ip)
        return UserRead(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            phone=user.phone,
            location=user.location,
            is_banned=user.is_banned,
            is_main_admin=user.is_main_admin,
            created_at=user.created_at,
        )
    except AdminRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/audit-logs", response_model=AuditLogPage)
def list_audit_logs(
    _: AdminUserDep,
    service: AdminServiceDep,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    action: Annotated[str | None, Query(description="Filter by action like LOGIN, FAILED_LOGIN, USER_BANNED")] = None,
    search: Annotated[str | None, Query(description="Search email, action, details, IP")] = None,
) -> AuditLogPage:
    """Retrieve paginated security and system audit logs (Admin only)."""
    return service.list_audit_logs(offset=offset, limit=limit, action=action, search=search)


@router.get("/audit-logs/export-csv")
def export_audit_logs_csv(
    _: AdminUserDep,
    service: AdminServiceDep,
) -> Response:
    """Export complete audit log history as a downloadable CSV spreadsheet file."""
    csv_content = service.export_audit_logs_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=agroconnect_audit_logs.csv",
            "Content-Type": "text/csv; charset=utf-8",
        },
    )
