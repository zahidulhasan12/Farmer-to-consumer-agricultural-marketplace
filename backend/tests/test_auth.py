"""Comprehensive Pytest test suite for AgroConnect Authentication & Session Security.
Tests cover:
- Farmer & Consumer signup
- Duplicate email prevention
- Field validation
- Successful login and JWT issuance
- Invalid credentials handling
- Token rotation and session refreshing
- Revoked token reuse detection
- Logout and session invalidation
- Password change functionality
- 5-attempt brute-force rate limiting and account lockout
"""
import uuid
import pytest
from fastapi.testclient import TestClient


def test_signup_farmer_success(client: TestClient) -> None:
    unique_email = f"farmer_{uuid.uuid4().hex[:8]}@agroconnect.com"
    payload = {
        "email": unique_email,
        "password": "FarmerPassword123!",
        "name": "Test Farmer Alpha",
        "role": "FARMER",
        "phone": "+8801700000001",
        "location": "Rangpur",
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == payload["email"]
    assert data["user"]["name"] == payload["name"]
    assert data["user"]["role"] == "FARMER"
    assert "id" in data["user"]
    assert "access_token" in data
    assert "refresh_token" in data


def test_signup_duplicate_email_conflict(client: TestClient) -> None:
    unique_email = f"dup_{uuid.uuid4().hex[:8]}@agroconnect.com"
    payload = {
        "email": unique_email,
        "password": "FarmerPassword123!",
        "name": "Original Farmer",
        "role": "FARMER",
    }
    # 1. First signup succeeds
    res1 = client.post("/api/v1/auth/signup", json=payload)
    assert res1.status_code == 201

    # 2. Second signup with same email must fail with 409
    res2 = client.post("/api/v1/auth/signup", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_signup_invalid_data(client: TestClient) -> None:
    # Too short password (<6 chars)
    payload = {
        "email": f"short_{uuid.uuid4().hex[:8]}@agroconnect.com",
        "password": "123",
        "name": "Short Pass User",
        "role": "CONSUMER",
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 422


def test_login_success(client: TestClient) -> None:
    email = f"login_{uuid.uuid4().hex[:8]}@agroconnect.com"
    password = "FarmerPassword123!"
    client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password, "name": "Login Tester", "role": "FARMER"},
    )

    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email


def test_login_invalid_password(client: TestClient) -> None:
    email = f"inv_{uuid.uuid4().hex[:8]}@agroconnect.com"
    client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "CorrectPassword123!", "name": "Inv Tester", "role": "FARMER"},
    )

    response = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword123!"})
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_get_current_user_me(client: TestClient) -> None:
    email = f"me_{uuid.uuid4().hex[:8]}@agroconnect.com"
    password = "FarmerPassword123!"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password, "name": "Profile Tester", "role": "FARMER"},
    )
    token = signup_res.json()["access_token"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == email


def test_get_current_user_unauthorized(client: TestClient) -> None:
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_refresh_token_rotation(client: TestClient) -> None:
    email = f"rotate_{uuid.uuid4().hex[:8]}@agroconnect.com"
    password = "FarmerPassword123!"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password, "name": "Rotation Tester", "role": "FARMER"},
    )
    refresh_token_1 = signup_res.json()["refresh_token"]

    # Use refresh token to obtain a new pair
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token_1})
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    refresh_token_2 = data["refresh_token"]
    assert refresh_token_1 != refresh_token_2

    # Attempting to use old refresh_token_1 again must fail (revoked token reuse)
    reuse_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token_1})
    assert reuse_res.status_code == 401
    assert "revoked" in reuse_res.json()["detail"].lower()


def test_logout_revocation(client: TestClient) -> None:
    email = f"logout_{uuid.uuid4().hex[:8]}@agroconnect.com"
    password = "FarmerPassword123!"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password, "name": "Logout Tester", "role": "FARMER"},
    )
    token = signup_res.json()["access_token"]
    refresh_token = signup_res.json()["refresh_token"]

    # Logout with token
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
        json={"refresh_token": refresh_token},
    )
    assert logout_res.status_code == 200

    # Verify refresh token is revoked
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 401


def test_change_password(client: TestClient) -> None:
    user_email = f"pwd_{uuid.uuid4().hex[:8]}@agroconnect.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "email": user_email,
            "password": "OldPassword123!",
            "name": "Password Change Tester",
            "role": "CONSUMER",
        },
    )
    token = signup_res.json()["access_token"]

    # Change password (PUT method)
    change_res = client.put(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "OldPassword123!", "new_password": "BrandNewPassword456!"},
    )
    assert change_res.status_code == 200

    # Old password should now fail
    failed_login = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": "OldPassword123!"},
    )
    assert failed_login.status_code == 401

    # New password should succeed
    success_login = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": "BrandNewPassword456!"},
    )
    assert success_login.status_code == 200


def test_brute_force_account_lockout(client: TestClient) -> None:
    victim_email = f"victim_{uuid.uuid4().hex[:8]}@agroconnect.com"
    client.post(
        "/api/v1/auth/signup",
        json={
            "email": victim_email,
            "password": "RealSecretPassword123!",
            "name": "Lockout Target",
            "role": "CONSUMER",
        },
    )

    # 4 failed attempts -> 401
    for _ in range(4):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": victim_email, "password": "WrongPasswordAttempt"},
        )
        assert res.status_code == 401

    # 5th failed attempt -> 423 Locked
    fifth_res = client.post(
        "/api/v1/auth/login",
        json={"email": victim_email, "password": "WrongPasswordAttempt"},
    )
    assert fifth_res.status_code == 423
    assert "locked" in fifth_res.json()["detail"].lower()
