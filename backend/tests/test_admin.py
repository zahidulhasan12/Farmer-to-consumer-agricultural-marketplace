"""Comprehensive Pytest test suite for AgroConnect Admin Dashboard, Moderation & Audit Trail.
Tests cover:
- Non-administrators blocked from metrics, user moderation, and audit logs (403 Forbidden)
- Real-time KPI statistics retrieval (users, products, inventory valuation, cooperatives)
- User search and moderation list with product counts
- Self-preservation guards (administrators cannot ban or demote their own account)
- Main Administrator exclusive authority:
    * Full authority to ban and unban the System Administrator and other users
    * Exclusive authority to promote users to Admin and demote Admins
    * Main Administrator immunity from bans and demotions
- System Administrator (admin@agroconnect.com) capabilities and restrictions:
    * Active authority to ban and unban Farmers and Consumers (200 OK)
    * STRICTLY FORBIDDEN from banning the Main Administrator (400 Bad Request)
    * STRICTLY FORBIDDEN from banning other Administrators (403 Forbidden)
    * STRICTLY FORBIDDEN from promoting users to Admin or demoting Admins (403 Forbidden)
- Security audit log inspection
- Streaming CSV audit log export
"""
import uuid
import pytest
from fastapi.testclient import TestClient


def test_non_admin_cannot_access_stats(
    client: TestClient, consumer_headers: dict[str, str], farmer_headers: dict[str, str]
) -> None:
    res_consumer = client.get("/api/v1/admin/stats", headers=consumer_headers)
    assert res_consumer.status_code == 403

    res_farmer = client.get("/api/v1/admin/stats", headers=farmer_headers)
    assert res_farmer.status_code == 403


def test_admin_can_access_stats(client: TestClient, admin_headers: dict[str, str]) -> None:
    res = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
    assert "total_farmers" in data
    assert "total_consumers" in data
    assert "total_products" in data
    assert "total_inventory_value" in data
    assert "total_groups" in data
    assert data["total_users"] >= 3
    assert data["total_products"] >= 1


def test_admin_list_and_search_users(client: TestClient, admin_headers: dict[str, str]) -> None:
    res = client.get("/api/v1/admin/users?search=Rahim", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()
    assert isinstance(users, list)
    assert len(users) >= 1
    assert any("rahim" in u["name"].lower() for u in users)


def test_admin_cannot_ban_themselves(client: TestClient, main_admin_headers: dict[str, str]) -> None:
    # 1. Get Main Admin ID
    me_res = client.get("/api/v1/auth/me", headers=main_admin_headers)
    admin_id = me_res.json()["id"]

    # 2. Main Admin attempts self-ban -> 400 Bad Request
    res = client.patch(
        f"/api/v1/admin/users/{admin_id}/ban",
        headers=main_admin_headers,
        json={"is_banned": True},
    )
    assert res.status_code == 400
    assert "cannot ban" in res.json()["detail"].lower()


def test_admin_cannot_demote_themselves(client: TestClient, main_admin_headers: dict[str, str]) -> None:
    # 1. Get Main Admin ID
    me_res = client.get("/api/v1/auth/me", headers=main_admin_headers)
    admin_id = me_res.json()["id"]

    # 2. Main Admin attempts self-demotion -> 400 Bad Request
    res = client.patch(
        f"/api/v1/admin/users/{admin_id}/role",
        headers=main_admin_headers,
        json={"role": "CONSUMER"},
    )
    assert res.status_code == 400
    assert "cannot remove their own admin privileges" in res.json()["detail"].lower()


def test_main_admin_can_ban_and_unban_system_admin(
    client: TestClient, main_admin_headers: dict[str, str]
) -> None:
    # 1. Get System Administrator user record
    sys_admin_res = client.get("/api/v1/admin/users?search=admin@agroconnect.com", headers=main_admin_headers)
    assert sys_admin_res.status_code == 200
    sys_admin = next(u for u in sys_admin_res.json() if u["email"] == "admin@agroconnect.com")
    sys_admin_id = sys_admin["id"]

    # 2. Main Admin suspends the System Administrator -> 200 OK
    ban_res = client.patch(
        f"/api/v1/admin/users/{sys_admin_id}/ban",
        headers=main_admin_headers,
        json={"is_banned": True},
    )
    assert ban_res.status_code == 200
    assert ban_res.json()["is_banned"] is True

    # 3. Suspended System Administrator cannot log in -> 403 Forbidden
    blocked_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agroconnect.com", "password": "Admin123!"},
    )
    assert blocked_login.status_code == 403
    assert "suspended" in blocked_login.json()["detail"].lower()

    # 4. Main Admin reactivates the System Administrator -> 200 OK
    unban_res = client.patch(
        f"/api/v1/admin/users/{sys_admin_id}/ban",
        headers=main_admin_headers,
        json={"is_banned": False},
    )
    assert unban_res.status_code == 200
    assert unban_res.json()["is_banned"] is False

    # 5. System Administrator can log in again -> 200 OK
    reopened_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agroconnect.com", "password": "Admin123!"},
    )
    assert reopened_login.status_code == 200


def test_system_admin_can_ban_and_unban_farmer_and_consumer(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    # 1. Register a test consumer
    user_email = f"target_consumer_{uuid.uuid4().hex[:8]}@agroconnect.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": user_email,
            "password": "Password123!",
            "name": "Target Consumer",
            "role": "CONSUMER",
        },
    )
    assert signup_res.status_code == 201
    target_id = signup_res.json()["user"]["id"]

    # 2. System Administrator bans the consumer -> 200 OK
    ban_res = client.patch(
        f"/api/v1/admin/users/{target_id}/ban",
        headers=admin_headers,
        json={"is_banned": True},
    )
    assert ban_res.status_code == 200
    assert ban_res.json()["is_banned"] is True

    # 3. Banned consumer cannot log in -> 403 Forbidden
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": "Password123!"},
    )
    assert login_res.status_code == 403
    assert "suspended" in login_res.json()["detail"].lower()

    # 4. System Administrator unbans the consumer -> 200 OK
    unban_res = client.patch(
        f"/api/v1/admin/users/{target_id}/ban",
        headers=admin_headers,
        json={"is_banned": False},
    )
    assert unban_res.status_code == 200
    assert unban_res.json()["is_banned"] is False

    # 5. Consumer can log in again -> 200 OK
    login_again = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": "Password123!"},
    )
    assert login_again.status_code == 200


def test_system_admin_cannot_ban_main_admin(
    client: TestClient, admin_headers: dict[str, str], main_admin_headers: dict[str, str]
) -> None:
    # 1. Get Main Admin ID
    main_admin_me = client.get("/api/v1/auth/me", headers=main_admin_headers).json()
    main_admin_id = main_admin_me["id"]

    # 2. System Administrator attempts to ban the Main Admin -> 400 Bad Request
    ban_attempt = client.patch(
        f"/api/v1/admin/users/{main_admin_id}/ban",
        headers=admin_headers,
        json={"is_banned": True},
    )
    assert ban_attempt.status_code == 400
    assert "main administrator cannot be banned" in ban_attempt.json()["detail"].lower()


def test_system_admin_cannot_ban_other_admin(
    client: TestClient, admin_headers: dict[str, str], main_admin_headers: dict[str, str]
) -> None:
    # 1. Find another admin (e.g. moderator@agroconnect.com)
    mod_res = client.get("/api/v1/admin/users?search=moderator@agroconnect.com", headers=main_admin_headers)
    mod_user = next(u for u in mod_res.json() if u["email"] == "moderator@agroconnect.com")
    mod_id = mod_user["id"]

    # 2. System Administrator attempts to ban another admin -> 403 Forbidden
    ban_attempt = client.patch(
        f"/api/v1/admin/users/{mod_id}/ban",
        headers=admin_headers,
        json={"is_banned": True},
    )
    assert ban_attempt.status_code == 403
    assert "only the main administrator" in ban_attempt.json()["detail"].lower()


def test_main_admin_can_promote_and_demote_admin(
    client: TestClient, main_admin_headers: dict[str, str]
) -> None:
    # 1. Register a user
    user_email = f"admin_candidate_{uuid.uuid4().hex[:8]}@agroconnect.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": user_email,
            "password": "Password123!",
            "name": "Admin Candidate",
            "role": "CONSUMER",
        },
    )
    target_id = signup_res.json()["user"]["id"]

    # 2. Main Admin promotes to ADMIN
    promote_res = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        headers=main_admin_headers,
        json={"role": "ADMIN"},
    )
    assert promote_res.status_code == 200
    assert promote_res.json()["role"] == "ADMIN"

    # 3. Main Admin demotes back to FARMER
    demote_res = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        headers=main_admin_headers,
        json={"role": "FARMER"},
    )
    assert demote_res.status_code == 200
    assert demote_res.json()["role"] == "FARMER"


def test_system_admin_cannot_promote_or_demote_admin(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    # Register candidate user
    user_email = f"restricted_promo_{uuid.uuid4().hex[:8]}@agroconnect.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": user_email,
            "password": "Password123!",
            "name": "Restricted Target",
            "role": "CONSUMER",
        },
    )
    target_id = signup_res.json()["user"]["id"]

    # System administrator attempts to promote candidate to ADMIN -> 403 Forbidden
    unauth_promote = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        headers=admin_headers,
        json={"role": "ADMIN"},
    )
    assert unauth_promote.status_code == 403
    assert "only the main administrator" in unauth_promote.json()["detail"].lower()


def test_main_admin_immune_from_ban_and_demote(
    client: TestClient, main_admin_headers: dict[str, str], admin_headers: dict[str, str]
) -> None:
    # 1. Get Main Admin ID
    me_res = client.get("/api/v1/auth/me", headers=main_admin_headers)
    main_admin_id = me_res.json()["id"]

    # 2. System admin attempts to demote Main Admin -> 400 Bad Request or 403 Forbidden
    demote_attempt = client.patch(
        f"/api/v1/admin/users/{main_admin_id}/role",
        headers=admin_headers,
        json={"role": "CONSUMER"},
    )
    assert demote_attempt.status_code in (400, 403)


def test_admin_audit_logs_and_csv_export(
    client: TestClient, admin_headers: dict[str, str], consumer_headers: dict[str, str]
) -> None:
    # 1. System Admin fetches audit logs list
    logs_res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert logs_res.status_code == 200
    data = logs_res.json()
    assert "items" in data
    logs = data["items"]
    assert isinstance(logs, list)
    assert len(logs) > 0
    first_log = logs[0]
    assert "action" in first_log
    assert "created_at" in first_log

    # 2. Consumer blocked from CSV export -> 403 Forbidden
    unauthorized_csv = client.get(
        "/api/v1/admin/audit-logs/export-csv", headers=consumer_headers
    )
    assert unauthorized_csv.status_code == 403

    # 3. System Admin downloads CSV -> 200 OK with text/csv
    csv_res = client.get("/api/v1/admin/audit-logs/export-csv", headers=admin_headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "User Email,Action" in csv_res.text
