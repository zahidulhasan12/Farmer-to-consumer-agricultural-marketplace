# FastAPI dependencies for injecting AuthService and validating JWT access tokens.
import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.models import User
from app.auth.repository import AuthRepository
from app.auth.service import AuthService
from app.database import SessionDep

security_bearer = HTTPBearer(auto_error=False)


def get_auth_service(session: SessionDep) -> AuthService:
    return AuthService(AuthRepository(session))


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_current_user_optional(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_bearer)],
    service: AuthServiceDep,
) -> User | None:
    token: str | None = None
    if credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        return None

    try:
        payload = service.decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user = service.repo.get_user_by_id(uuid.UUID(user_id_str))
        if not user or user.is_banned:
            return None
        return user
    except Exception:
        return None


def get_current_user(
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


def require_admin(current_user: CurrentUserDep) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required for this action.",
        )
    return current_user


AdminUserDep = Annotated[User, Depends(require_admin)]
