"""Comprehensive Pytest test suite for AgroConnect Role-Based Access Control (RBAC).
Tests cover:
- Consumers blocked from creating agricultural listings (403 Forbidden)
- Farmers successfully creating listings with auto-assigned user_id
- Owner farmer updating their own listings (200 OK)
- Non-owner farmers blocked from updating another farmer's product (403 Forbidden)
- Non-owner farmers blocked from deleting another farmer's product (403 Forbidden)
- Platform Administrators having full override privileges (edit/delete any listing)
- Farmer Dashboard '?mine=true' isolation filter
- Public read access for the consumer marketplace
"""
import pytest
from fastapi.testclient import TestClient


def test_consumer_cannot_create_product(client: TestClient, consumer_headers: dict[str, str]) -> None:
    payload = {
        "name": "Unauthorized Mangoes",
        "category": "Fruits",
        "price": 120.0,
        "quantity": 50,
        "farmer_location": "Rajshahi",
    }
    response = client.post("/api/v1/products", headers=consumer_headers, json=payload)
    assert response.status_code == 403
    assert "farmers and administrators" in response.json()["detail"].lower()


def test_farmer_can_create_product(client: TestClient, farmer_headers: dict[str, str]) -> None:
    payload = {
        "name": "Fresh Bogura Cauliflower",
        "category": "Vegetables",
        "price": 45.0,
        "unit": "piece",
        "quantity": 100,
        "farmer_location": "Bogura",
        "description": "Crisp farm-fresh cauliflower harvested this morning.",
    }
    response = client.post("/api/v1/products", headers=farmer_headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["category"] == payload["category"]
    assert data["price"] == payload["price"]
    assert data["user_id"] is not None
    assert "id" in data


def test_farmer_can_update_own_product(client: TestClient, farmer_headers: dict[str, str]) -> None:
    # 1. Create a product as Rahim
    create_res = client.post(
        "/api/v1/products",
        headers=farmer_headers,
        json={
            "name": "Bogura Red Potatoes",
            "category": "Vegetables",
            "price": 30.0,
            "quantity": 200,
            "farmer_location": "Bogura",
        },
    )
    product_id = create_res.json()["id"]

    # 2. Update price and quantity as Rahim
    update_res = client.put(
        f"/api/v1/products/{product_id}",
        headers=farmer_headers,
        json={"price": 32.5, "quantity": 180},
    )
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 32.5
    assert update_res.json()["quantity"] == 180


def test_other_farmer_cannot_modify_or_delete_product(
    client: TestClient, farmer_headers: dict[str, str]
) -> None:
    # 1. Farmer Rahim creates product
    create_res = client.post(
        "/api/v1/products",
        headers=farmer_headers,
        json={
            "name": "Rahim's Special Cabbage",
            "category": "Vegetables",
            "price": 25.0,
            "quantity": 80,
            "farmer_location": "Bogura",
        },
    )
    product_id = create_res.json()["id"]

    # 2. Login as Farmer Karim
    karim_login = client.post(
        "/api/v1/auth/login",
        json={"email": "farmer.karim@agroconnect.com", "password": "Farmer123!"},
    )
    karim_headers = {"Authorization": f"Bearer {karim_login.json()['access_token']}"}

    # 3. Karim attempts to modify Rahim's product -> 403 Forbidden
    update_res = client.put(
        f"/api/v1/products/{product_id}",
        headers=karim_headers,
        json={"price": 99.0},
    )
    assert update_res.status_code == 403
    assert "permission" in update_res.json()["detail"].lower()

    # 4. Karim attempts to delete Rahim's product -> 403 Forbidden
    delete_res = client.delete(
        f"/api/v1/products/{product_id}",
        headers=karim_headers,
    )
    assert delete_res.status_code == 403
    assert "permission" in delete_res.json()["detail"].lower()


def test_admin_can_update_and_delete_any_product(
    client: TestClient, farmer_headers: dict[str, str], admin_headers: dict[str, str]
) -> None:
    # 1. Farmer creates product
    create_res = client.post(
        "/api/v1/products",
        headers=farmer_headers,
        json={
            "name": "Admin Moderation Target Honey",
            "category": "Other",
            "price": 850.0,
            "quantity": 15,
            "farmer_location": "Sundarbans",
        },
    )
    product_id = create_res.json()["id"]

    # 2. Admin edits product -> 200 OK
    admin_edit = client.put(
        f"/api/v1/products/{product_id}",
        headers=admin_headers,
        json={"price": 800.0, "description": "Price moderated by admin"},
    )
    assert admin_edit.status_code == 200
    assert admin_edit.json()["price"] == 800.0

    # 3. Admin deletes product -> 204 No Content
    admin_del = client.delete(
        f"/api/v1/products/{product_id}",
        headers=admin_headers,
    )
    assert admin_del.status_code == 204


def test_farmer_mine_filter_isolation(
    client: TestClient, farmer_headers: dict[str, str]
) -> None:
    res = client.get("/api/v1/products?mine=true", headers=farmer_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    products = data["items"]
    assert isinstance(products, list)
    # Get Rahim's user profile to verify IDs
    me_res = client.get("/api/v1/auth/me", headers=farmer_headers)
    my_user_id = me_res.json()["id"]
    for p in products:
        assert p["user_id"] == my_user_id


def test_public_can_view_marketplace_products(client: TestClient) -> None:
    res = client.get("/api/v1/products")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    products = data["items"]
    assert isinstance(products, list)
    assert len(products) > 0
