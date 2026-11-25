# Authentication API endpoints: Signup, Login, Refresh, Logout, Me, Password Change.
from fastapi import APIRouter, HTTPException, Request, Response, status

from app.auth.dependencies import AuthServiceDep, CurrentUserDep
from app.auth.models import User
from app.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    SignupRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserRead,
)
from app.auth.service import AuthRuleError
from app.config import settings

router = APIRouter(tags=["Authentication"])


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=raw_token,
        httponly=True,
        secure=False,  # Set to True when served over HTTPS in production
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    service: AuthServiceDep,
) -> TokenResponse:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    try:
        token_res = service.signup(payload, user_agent=ua, ip_address=ip)
        _set_refresh_cookie(response, token_res.refresh_token)
        return token_res
    except AuthRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: AuthServiceDep,
) -> TokenResponse:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    try:
        token_res = service.login(payload, user_agent=ua, ip_address=ip)
        _set_refresh_cookie(response, token_res.refresh_token)
        return token_res
    except AuthRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    service: AuthServiceDep,
    payload: RefreshTokenRequest | None = None,
) -> TokenResponse:
    # Accept token from request body or HttpOnly cookie
    raw_token = (payload.refresh_token if payload and payload.refresh_token else None) or request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing from body and cookies.",
        )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    try:
        token_res = service.refresh(raw_token, user_agent=ua, ip_address=ip)
        _set_refresh_cookie(response, token_res.refresh_token)
        return token_res
    except AuthRuleError as e:
        response.delete_cookie(key="refresh_token", path="/")
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    service: AuthServiceDep,
    payload: RefreshTokenRequest | None = None,
) -> dict[str, str]:
    raw_token = (payload.refresh_token if payload and payload.refresh_token else None) or request.cookies.get("refresh_token")
    if raw_token:
        service.logout(raw_token)
    response.delete_cookie(key="refresh_token", path="/")
    return {"status": "ok", "message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: CurrentUserDep) -> UserRead:
    return UserRead(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        phone=current_user.phone,
        location=current_user.location,
        is_banned=current_user.is_banned,
        is_main_admin=current_user.is_main_admin,
        created_at=current_user.created_at,
    )


@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUserDep,
    service: AuthServiceDep,
) -> dict[str, str]:
    try:
        service.change_password(current_user, payload)
        return {"status": "ok", "message": "Password changed successfully. Please log in again with your new password."}
    except AuthRuleError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/profile", response_model=UserRead)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: CurrentUserDep,
    service: AuthServiceDep,
) -> UserRead:
    updated = service.update_profile(current_user, payload)
    return UserRead(
        id=updated.id,
        email=updated.email,
        name=updated.name,
        role=updated.role,
        phone=updated.phone,
        location=updated.location,
        is_banned=updated.is_banned,
        created_at=updated.created_at,
    )
