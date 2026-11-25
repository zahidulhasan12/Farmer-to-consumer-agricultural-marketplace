# Business logic for authentication, Argon2 password hashing, and stateful JWT refresh sessions.
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash

from app.admin.audit import log_audit_event
from app.auth.models import RefreshToken, User
from app.auth.repository import AuthRepository
from app.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserRead,
)
from app.config import settings

_pwd_hash = PasswordHash.recommended()


class AuthRuleError(Exception):
    """Raised when an authentication or registration rule is violated."""
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_token(raw_token: str) -> str:
    """Hash refresh tokens before database storage to protect against DB leaks."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, repository: AuthRepository) -> None:
        self.repo = repository

    def hash_password(self, password: str) -> str:
        return _pwd_hash.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return _pwd_hash.verify(plain_password, hashed_password)
        except Exception:
            return False

    def create_access_token(self, user: User) -> str:
        now = utc_now()
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "iat": int(now.timestamp()),
            "exp": int(expire.timestamp()),
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    def decode_access_token(self, token: str) -> dict:
        try:
            return jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except jwt.ExpiredSignatureError:
            raise AuthRuleError("Access token has expired", status_code=401)
        except jwt.InvalidTokenError:
            raise AuthRuleError("Invalid access token", status_code=401)

    def create_refresh_session(
        self,
        user: User,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[str, RefreshToken]:
        raw_token = secrets.token_urlsafe(48)
        token_hash = hash_token(raw_token)
        expires_at = utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        session_record = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_revoked=False,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.repo.create_refresh_token(session_record)
        return raw_token, session_record

    def signup(
        self,
        payload: SignupRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        existing = self.repo.get_user_by_email(payload.email)
        if existing:
            raise AuthRuleError("An account with this email already exists", status_code=409)

        user = User(
            email=payload.email.lower().strip(),
            hashed_password=self.hash_password(payload.password),
            name=payload.name.strip(),
            role=payload.role,
            phone=payload.phone.strip() if payload.phone else None,
            location=payload.location.strip() if payload.location else "Bogura",
            is_banned=False,
        )
        created_user = self.repo.create_user(user)

        access_token = self.create_access_token(created_user)
        raw_refresh, _ = self.create_refresh_session(created_user, user_agent, ip_address)

        log_audit_event(
            self.repo.session,
            action="SIGNUP",
            user_id=created_user.id,
            user_email=created_user.email,
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"New user registered with role {created_user.role}",
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead(
                id=created_user.id,
                email=created_user.email,
                name=created_user.name,
                role=created_user.role,
                phone=created_user.phone,
                location=created_user.location,
                is_banned=created_user.is_banned,
                is_main_admin=created_user.is_main_admin,
                created_at=created_user.created_at,
            ),
        )

    def login(
        self,
        payload: LoginRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        user = self.repo.get_user_by_email(payload.email)
        if not user:
            log_audit_event(
                self.repo.session,
                action="FAILED_LOGIN",
                user_email=payload.email,
                ip_address=ip_address,
                user_agent=user_agent,
                details="Attempted login with non-existent email address",
            )
            raise AuthRuleError("Invalid email or password", status_code=401)

        # Check ban status
        if user.is_banned:
            log_audit_event(
                self.repo.session,
                action="FAILED_LOGIN",
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address,
                user_agent=user_agent,
                details="Attempted login on a suspended account",
            )
            raise AuthRuleError("Your account has been suspended by an administrator", status_code=403)

        # Check account lockout
        now = utc_now()
        if user.locked_until and user.locked_until.tzinfo is None:
            user_locked = user.locked_until.replace(tzinfo=timezone.utc)
        else:
            user_locked = user.locked_until

        if user_locked and user_locked > now:
            minutes_left = int((user_locked - now).total_seconds() // 60) + 1
            log_audit_event(
                self.repo.session,
                action="FAILED_LOGIN",
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address,
                user_agent=user_agent,
                details=f"Login attempt while account is locked ({minutes_left}m remaining)",
            )
            raise AuthRuleError(
                f"Account is temporarily locked. Please try again in {minutes_left} minutes",
                status_code=423,
            )

        # Verify password
        if not self.verify_password(payload.password, user.hashed_password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
                self.repo.update_user(user)
                log_audit_event(
                    self.repo.session,
                    action="ACCOUNT_LOCKED",
                    user_id=user.id,
                    user_email=user.email,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    details="Account locked for 15 minutes due to 5 consecutive failed login attempts",
                )
                raise AuthRuleError(
                    "Too many failed login attempts. Account locked for 15 minutes.",
                    status_code=423,
                )
            self.repo.update_user(user)
            log_audit_event(
                self.repo.session,
                action="FAILED_LOGIN",
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address,
                user_agent=user_agent,
                details=f"Incorrect password attempt ({user.failed_login_attempts}/5)",
            )
            raise AuthRuleError("Invalid email or password", status_code=401)

        # Successful login: reset failed counters
        if user.failed_login_attempts > 0 or user.locked_until is not None:
            user.failed_login_attempts = 0
            user.locked_until = None
            self.repo.update_user(user)

        access_token = self.create_access_token(user)
        raw_refresh, _ = self.create_refresh_session(user, user_agent, ip_address)

        log_audit_event(
            self.repo.session,
            action="LOGIN",
            user_id=user.id,
            user_email=user.email,
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"User signed in successfully (Role: {user.role})",
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user.role,
                phone=user.phone,
                location=user.location,
                is_banned=user.is_banned,
                is_main_admin=user.is_main_admin,
                created_at=user.created_at,
            ),
        )

    def refresh(
        self,
        raw_refresh_token: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        token_h = hash_token(raw_refresh_token)
        session_record = self.repo.get_refresh_token_by_hash(token_h)

        if not session_record:
            raise AuthRuleError("Refresh token not found", status_code=401)

        if session_record.is_revoked:
            # Token reuse detected! Revoke all sessions for security
            self.repo.revoke_all_user_tokens(session_record.user_id)
            raise AuthRuleError("Revoked refresh token reuse detected. All sessions terminated.", status_code=401)

        now = utc_now()
        exp = session_record.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            self.repo.revoke_refresh_token(token_h)
            raise AuthRuleError("Refresh token has expired. Please sign in again.", status_code=401)

        user = self.repo.get_user_by_id(session_record.user_id)
        if not user or user.is_banned:
            self.repo.revoke_refresh_token(token_h)
            raise AuthRuleError("User account not found or suspended", status_code=401)

        # Token Rotation: Revoke current refresh token and issue a fresh one
        self.repo.revoke_refresh_token(token_h)

        new_access = self.create_access_token(user)
        new_raw_refresh, _ = self.create_refresh_session(user, user_agent, ip_address)

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_raw_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user.role,
                phone=user.phone,
                location=user.location,
                is_banned=user.is_banned,
                is_main_admin=user.is_main_admin,
                created_at=user.created_at,
            ),
        )

    def logout(self, raw_refresh_token: str) -> None:
        token_h = hash_token(raw_refresh_token)
        session_record = self.repo.get_refresh_token_by_hash(token_h)
        if session_record:
            user = self.repo.get_user_by_id(session_record.user_id)
            log_audit_event(
                self.repo.session,
                action="LOGOUT",
                user_id=session_record.user_id,
                user_email=user.email if user else None,
                details="User signed out; refresh session terminated",
            )
        self.repo.revoke_refresh_token(token_h)

    def change_password(self, user: User, payload: ChangePasswordRequest) -> None:
        if not self.verify_password(payload.current_password, user.hashed_password):
            raise AuthRuleError("Current password is incorrect", status_code=400)

        user.hashed_password = self.hash_password(payload.new_password)
        self.repo.update_user(user)
        # Invalidate existing refresh tokens so other sessions must re-login
        self.repo.revoke_all_user_tokens(user.id)

    def update_profile(self, user: User, payload: UpdateProfileRequest) -> User:
        if payload.name is not None and payload.name.strip():
            user.name = payload.name.strip()
        if payload.phone is not None:
            user.phone = payload.phone.strip()
        if payload.location is not None:
            user.location = payload.location.strip()
        return self.repo.update_user(user)
