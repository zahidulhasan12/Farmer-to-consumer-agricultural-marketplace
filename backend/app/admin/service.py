# Admin business logic for platform KPI analytics and user moderation.
import csv
import io
import uuid
from sqlmodel import Session, col, func, or_, select

from app.admin.audit import log_audit_event
from app.admin.models import AuditLog
from app.admin.schemas import AdminStats, AdminUserRead, AuditLogPage, AuditLogRead
from app.auth.models import User
from app.auth.repository import AuthRepository
from app.groups.models import Group
from app.products.models import Product


class AdminRuleError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AdminService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.auth_repo = AuthRepository(session)

    def get_stats(self) -> AdminStats:
        total_users = self.session.exec(select(func.count(User.id))).one()
        total_farmers = self.session.exec(select(func.count(User.id)).where(User.role == "FARMER")).one()
        total_consumers = self.session.exec(select(func.count(User.id)).where(User.role == "CONSUMER")).one()
        total_admins = self.session.exec(select(func.count(User.id)).where(User.role == "ADMIN")).one()
        banned_users = self.session.exec(select(func.count(User.id)).where(User.is_banned == True)).one()

        total_products = self.session.exec(select(func.count(Product.id))).one()
        in_stock_products = self.session.exec(
            select(func.count(Product.id)).where(Product.is_available == True, Product.quantity > 0)
        ).one()

        # Calculate total inventory value: sum(price * quantity)
        all_prods = self.session.exec(select(Product)).all()
        total_val = sum(p.price * p.quantity for p in all_prods)

        total_groups = self.session.exec(select(func.count(Group.id))).one()

        return AdminStats(
            total_users=total_users,
            total_farmers=total_farmers,
            total_consumers=total_consumers,
            total_admins=total_admins,
            banned_users=banned_users,
            total_products=total_products,
            in_stock_products=in_stock_products,
            total_inventory_value=round(total_val, 2),
            total_groups=total_groups,
        )

    def list_users(self, search: str | None = None) -> list[AdminUserRead]:
        statement = select(User)
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            statement = statement.where(or_(func.lower(User.name).like(term), func.lower(User.email).like(term)))
        statement = statement.order_by(col(User.created_at).desc())
        users = self.session.exec(statement).all()

        results: list[AdminUserRead] = []
        for u in users:
            prod_count = self.session.exec(
                select(func.count(Product.id)).where(Product.user_id == u.id)
            ).one()
            results.append(
                AdminUserRead(
                    id=u.id,
                    email=u.email,
                    name=u.name,
                    role=u.role,
                    phone=u.phone,
                    location=u.location,
                    is_banned=u.is_banned,
                    is_main_admin=u.is_main_admin,
                    created_at=u.created_at,
                    products_count=prod_count,
                )
            )
        return results

    def toggle_user_ban(self, current_admin: User, target_user_id: uuid.UUID, is_banned: bool, ip: str | None = None) -> User:
        if current_admin.id == target_user_id:
            raise AdminRuleError("Administrators cannot ban their own account.", status_code=400)

        target_user = self.auth_repo.get_user_by_id(target_user_id)
        if not target_user:
            raise AdminRuleError("User account not found.", status_code=404)

        # Main Administrator can NEVER be banned by anyone
        if target_user.is_main_admin:
            raise AdminRuleError("The Main Administrator cannot be banned.", status_code=400)

        # System Administrator can ban/unban FARMER and CONSUMER, but CANNOT ban other Administrators
        if not current_admin.is_main_admin:
            if target_user.role == "ADMIN":
                raise AdminRuleError("Only the Main Administrator can suspend or reactivate other Administrators.", status_code=403)

        target_user.is_banned = is_banned
        self.auth_repo.update_user(target_user)

        # If user is banned, revoke all active sessions immediately
        if is_banned:
            self.auth_repo.revoke_all_user_tokens(target_user.id)

        # Log audit trail
        log_audit_event(
            self.session,
            action="USER_BANNED" if is_banned else "USER_UNBANNED",
            user_id=current_admin.id,
            user_email=current_admin.email,
            ip_address=ip,
            details=f"{'Main Admin' if current_admin.is_main_admin else 'System Admin'} {current_admin.email} {'suspended' if is_banned else 'reactivated'} account {target_user.email} (Role: {target_user.role})",
        )

        return target_user

    def update_user_role(self, current_admin: User, target_user_id: uuid.UUID, new_role: str, ip: str | None = None) -> User:
        target_user = self.auth_repo.get_user_by_id(target_user_id)
        if not target_user:
            raise AdminRuleError("User account not found.", status_code=404)

        # Self-demotion check
        if current_admin.id == target_user_id and new_role != "ADMIN":
            raise AdminRuleError("Administrators cannot remove their own admin privileges.", status_code=400)

        # Main Administrator cannot be demoted
        if target_user.is_main_admin and new_role != "ADMIN":
            raise AdminRuleError("The Main Administrator cannot be demoted.", status_code=400)

        # Only Main Administrator can grant or revoke ADMIN privileges
        if (new_role == "ADMIN" or target_user.role == "ADMIN") and not current_admin.is_main_admin:
            raise AdminRuleError("Only the Main Administrator can promote users to Admin or demote Admins.", status_code=403)

        old_role = target_user.role
        target_user.role = new_role
        self.auth_repo.update_user(target_user)

        # Log audit trail
        log_audit_event(
            self.session,
            action="ROLE_CHANGED",
            user_id=current_admin.id,
            user_email=current_admin.email,
            ip_address=ip,
            details=f"Admin {current_admin.email} changed {target_user.email} role from {old_role} to {new_role}",
        )

        return target_user

    def list_audit_logs(
        self,
        offset: int = 0,
        limit: int = 50,
        action: str | None = None,
        search: str | None = None,
    ) -> AuditLogPage:
        statement = select(AuditLog)

        if action and action.upper() != "ALL":
            statement = statement.where(AuditLog.action == action.upper().strip())

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            statement = statement.where(
                or_(
                    func.lower(AuditLog.user_email).like(term),
                    func.lower(AuditLog.action).like(term),
                    func.lower(AuditLog.details).like(term),
                    func.lower(AuditLog.ip_address).like(term),
                )
            )

        total_statement = select(func.count(AuditLog.id))
        if action and action.upper() != "ALL":
            total_statement = total_statement.where(AuditLog.action == action.upper().strip())
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            total_statement = total_statement.where(
                or_(
                    func.lower(AuditLog.user_email).like(term),
                    func.lower(AuditLog.action).like(term),
                    func.lower(AuditLog.details).like(term),
                    func.lower(AuditLog.ip_address).like(term),
                )
            )

        total = self.session.exec(total_statement).one()
        logs = self.session.exec(
            statement.order_by(col(AuditLog.created_at).desc(), col(AuditLog.id).desc()).offset(offset).limit(limit)
        ).all()

        items = [
            AuditLogRead(
                id=l.id,
                user_id=l.user_id,
                user_email=l.user_email,
                action=l.action,
                ip_address=l.ip_address,
                user_agent=l.user_agent,
                details=l.details,
                created_at=l.created_at,
            )
            for l in logs
        ]

        return AuditLogPage(items=items, total=total, offset=offset, limit=limit)

    def export_audit_logs_csv(self) -> str:
        statement = select(AuditLog).order_by(col(AuditLog.created_at).desc())
        logs = self.session.exec(statement).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Log ID", "UTC Timestamp", "User Email", "Action", "IP Address", "User Agent", "Event Details"])

        for l in logs:
            writer.writerow([
                str(l.id),
                l.created_at.isoformat() if l.created_at else "",
                l.user_email or "Anonymous",
                l.action,
                l.ip_address or "Unknown",
                l.user_agent or "",
                l.details or "",
            ])

        return output.getvalue()
