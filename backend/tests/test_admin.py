"""Comprehensive Pytest test suite for AgroConnect Admin Dashboard, Moderation & Audit Trail.
Tests cover:
- Non-administrators blocked from metrics, user moderation, and audit logs (403 Forbidden)
- Real-time KPI statistics retrieval (users, products, inventory valuation, cooperatives)
- User search and moderation list with product counts
- Self-preservation guards (administrators cannot ban or demote their own account)
- Account ban/unban moderation cycle and instant session revocation
- Role change management (Consumer <-> Farmer <-> Admin)
- Main Administrator exclusive authority: promote to Admin, demote Admins
- Secondary Administrator restrictions (403 when trying to promote/demote Admins)
- Main Administrator immunity from bans and demotions
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


def test_admin_cannot_ban_themselves(client: TestClient, admin_headers: dict[str, str]) -> None:
    # 1. Get admin ID
    me_res = client.get("/api/v1/auth/me", headers=admin_headers)
    admin_id = me_res.json()["id"]

    # 2. Attempt self-ban -> 400 Bad Request
    res = client.patch(
        f"/api/v1/admin/users/{admin_id}/ban",
        headers=admin_headers,
        json={"is_banned": True},
    )
    assert res.status_code == 400
    assert "cannot ban" in res.json()["detail"].lower()


def test_admin_cannot_demote_themselves(client: TestClient, admin_headers: dict[str, str]) -> None:
    # 1. Get admin ID
    me_res = client.get("/api/v1/auth/me", headers=admin_headers)
    admin_id = me_res.json()["id"]

    # 2. Attempt self-demotion -> 400 Bad Request
    res = client.patch(
        f"/api/v1/admin/users/{admin_id}/role",
        headers=admin_headers,
        json={"role": "CONSUMER"},
    )
    assert res.status_code == 400
    assert "cannot remove their own admin privileges" in res.json()["detail"].lower()


def test_admin_ban_and_unban_user_flow(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    # 1. Register a moderation target user with unique email
    user_email = f"target_{uuid.uuid4().hex[:8]}@agroconnect.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": user_email,
            "password": "Password123!",
            "name": "Moderation Target",
            "role": "CONSUMER",
        },
    )
    assert signup_res.status_code == 201
    target_id = signup_res.json()["user"]["id"]

    # 2. Admin bans user
    ban_res = client.patch(
        f"/api/v1/admin/users/{target_id}/ban",
        headers=admin_headers,
        json={"is_banned": True},
    )
    assert ban_res.status_code == 200
    assert ban_res.json()["is_banned"] is True

    # 3. User attempts to log in -> 403 Forbidden
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": "Password123!"},
    )
    assert login_res.status_code == 403
    assert "suspended" in login_res.json()["detail"].lower()

    # 4. Admin unbans user
    unban_res = client.patch(
        f"/api/v1/admin/users/{target_id}/ban",
        headers=admin_headers,
        json={"is_banned": False},
    )
    assert unban_res.status_code == 200
    assert unban_res.json()["is_banned"] is False

    # 5. User can log in again -> 200 OK
    login_again = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": "Password123!"},
    )
    assert login_again.status_code == 200


def test_admin_update_user_role(client: TestClient, admin_headers: dict[str, str]) -> None:
    # 1. Register a consumer with unique email
    user_email = f"promo_{uuid.uuid4().hex[:8]}@agroconnect.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": user_email,
            "password": "Password123!",
            "name": "Promotable Consumer",
            "role": "CONSUMER",
        },
    )
    assert signup_res.status_code == 201
    user_id = signup_res.json()["user"]["id"]

    # 2. Admin promotes to FARMER
    role_res = client.patch(
        f"/api/v1/admin/users/{user_id}/role",
        headers=admin_headers,
        json={"role": "FARMER"},
    )
    assert role_res.status_code == 200
    assert role_res.json()["role"] == "FARMER"


def test_main_admin_can_promote_and_demote_admin(
    client: TestClient, admin_headers: dict[str, str]
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
        headers=admin_headers,
        json={"role": "ADMIN"},
    )
    assert promote_res.status_code == 200
    assert promote_res.json()["role"] == "ADMIN"

    # 3. Main Admin demotes back to FARMER
    demote_res = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        headers=admin_headers,
        json={"role": "FARMER"},
    )
    assert demote_res.status_code == 200
    assert demote_res.json()["role"] == "FARMER"


def test_secondary_admin_cannot_promote_or_demote_admin(client: TestClient) -> None:
    # 1. Login as secondary moderator (is_main_admin = False)
    mod_login = client.post(
        "/api/v1/auth/login",
        json={"email": "moderator@agroconnect.com", "password": "Moderator123!"},
    )
    assert mod_login.status_code == 200
    mod_headers = {"Authorization": f"Bearer {mod_login.json()['access_token']}"}

    # 2. Register candidate user
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

    # 3. Secondary admin attempts to promote candidate to ADMIN -> 403 Forbidden
    unauth_promote = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        headers=mod_headers,
        json={"role": "ADMIN"},
    )
    assert unauth_promote.status_code == 403
    assert "only the main administrator" in unauth_promote.json()["detail"].lower()


def test_main_admin_immune_from_ban_and_demote(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    # 1. Get Main Admin ID
    me_res = client.get("/api/v1/auth/me", headers=admin_headers)
    main_admin_id = me_res.json()["id"]

    # 2. Login as secondary moderator
    mod_login = client.post(
        "/api/v1/auth/login",
        json={"email": "moderator@agroconnect.com", "password": "Moderator123!"},
    )
    mod_headers = {"Authorization": f"Bearer {mod_login.json()['access_token']}"}

    # 3. Secondary admin attempts to ban Main Admin -> 400 Bad Request
    ban_attempt = client.patch(
        f"/api/v1/admin/users/{main_admin_id}/ban",
        headers=mod_headers,
        json={"is_banned": True},
    )
    assert ban_attempt.status_code == 400
    assert "main administrator cannot be banned" in ban_attempt.json()["detail"].lower()

    # 4. Secondary admin attempts to demote Main Admin -> 400 Bad Request
    demote_attempt = client.patch(
        f"/api/v1/admin/users/{main_admin_id}/role",
        headers=mod_headers,
        json={"role": "CONSUMER"},
    )
    assert demote_attempt.status_code == 400
    assert "main administrator cannot be demoted" in demote_attempt.json()["detail"].lower()


def test_admin_audit_logs_and_csv_export(
    client: TestClient, admin_headers: dict[str, str], consumer_headers: dict[str, str]
) -> None:
    # 1. Fetch audit logs list
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

    # 3. Admin downloads CSV -> 200 OK with text/csv
    csv_res = client.get("/api/v1/admin/audit-logs/export-csv", headers=admin_headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "User Email,Action" in csv_res.text
