# Audit logging helper utility to record security and business events across the application.
import logging
import uuid
from sqlmodel import Session

from app.admin.models import AuditLog

logger = logging.getLogger("agroconnect.audit")


def log_audit_event(
    session: Session,
    action: str,
    user_id: uuid.UUID | None = None,
    user_email: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    details: str | None = None,
) -> AuditLog:
    """Safely log an audit event to the database and system logger."""
    try:
        log_entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent[:490] if user_agent else None,
            details=details,
        )
        session.add(log_entry)
        session.commit()
        session.refresh(log_entry)
        logger.info("AUDIT [%s] user=%s ip=%s details=%s", action, user_email or user_id, ip_address, details)
        return log_entry
    except Exception as e:
        logger.error("Failed to write audit log entry for action %s: %s", action, e)
        # Avoid breaking the main business transaction if audit writing fails
        return None
