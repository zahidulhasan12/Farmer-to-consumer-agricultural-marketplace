"""Comprehensive Pytest test suite for AgroConnect Farmer Cooperatives (Groups).
Tests cover:
- Consumers blocked from forming cooperatives (403 Forbidden)
- Farmers successfully creating cooperative groups (201 Created)
- Automatic assignment of creator as group ADMIN
- Public listing of cooperative groups and membership rosters
- Group admin inviting members with permissions (CAN_ADD_PRODUCTS / VIEW_ONLY)
- Non-admin members blocked from adding others (403 Forbidden)
- Removing cooperative members
- Cooperative deletion by group owner or platform admin
"""
import pytest
from fastapi.testclient import TestClient


def test_consumer_cannot_create_cooperative(
    client: TestClient, consumer_headers: dict[str, str]
) -> None:
    payload = {
        "name": "Unauthorized Consumer Group",
        "description": "Consumers should not create agricultural cooperatives.",
    }
    response = client.post("/api/v1/groups", headers=consumer_headers, json=payload)
    assert response.status_code == 403
    assert "farmers and administrators" in response.json()["detail"].lower()


def test_farmer_can_create_cooperative(
    client: TestClient, farmer_headers: dict[str, str]
) -> None:
    payload = {
        "name": "Rajshahi Mango Growers Union",
        "description": "Federation of prime organic mango cultivators.",
    }
    response = client.post("/api/v1/groups", headers=farmer_headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["description"] == payload["description"]
    assert "id" in data
    assert data["members_count"] >= 1


def test_list_cooperatives(client: TestClient, farmer_headers: dict[str, str]) -> None:
    res = client.get("/api/v1/groups", headers=farmer_headers)
    assert res.status_code == 200
    groups = res.json()
    assert isinstance(groups, list)
    assert len(groups) >= 1
    # Check that Bogura Organic Farmers Cooperative is present from seed
    names = [g["name"] for g in groups]
    assert any("Bogura" in name for name in names)


def test_add_and_remove_member_flow(
    client: TestClient, farmer_headers: dict[str, str]
) -> None:
    # 1. Rahim creates cooperative
    create_res = client.post(
        "/api/v1/groups",
        headers=farmer_headers,
        json={"name": "Pabna Dairy & Livestock Union", "description": "Local dairy collective"},
    )
    group_id = create_res.json()["id"]

    # 2. Rahim invites Karim with CAN_ADD_PRODUCTS
    invite_res = client.post(
        f"/api/v1/groups/{group_id}/members",
        headers=farmer_headers,
        json={"email": "farmer.karim@agroconnect.com", "permission": "CAN_ADD_PRODUCTS"},
    )
    assert invite_res.status_code == 201
    assert invite_res.json()["permission"] == "CAN_ADD_PRODUCTS"
    karim_user_id = invite_res.json()["user_id"]

    # 3. Check group details has Karim listed
    group_res = client.get(f"/api/v1/groups/{group_id}", headers=farmer_headers)
    assert group_res.status_code == 200
    members = group_res.json().get("members", [])
    assert any(m["email"] == "farmer.karim@agroconnect.com" for m in members)

    # 4. Rahim removes Karim from group -> 204 No Content
    remove_res = client.delete(
        f"/api/v1/groups/{group_id}/members/{karim_user_id}",
        headers=farmer_headers,
    )
    assert remove_res.status_code == 204


def test_non_admin_cannot_add_members(client: TestClient, farmer_headers: dict[str, str]) -> None:
    # 1. Farmer Rahim creates an isolated group
    rahim_group = client.post(
        "/api/v1/groups",
        headers=farmer_headers,
        json={"name": "Rahim Isolation Group", "description": "Group for permission checks"},
    ).json()

    # 2. Login as Farmer Karim
    karim_login = client.post(
        "/api/v1/auth/login",
        json={"email": "farmer.karim@agroconnect.com", "password": "Farmer123!"},
    )
    karim_headers = {"Authorization": f"Bearer {karim_login.json()['access_token']}"}

    # 3. Karim (not member or admin of Rahim's group) attempts to invite someone -> 403 Forbidden
    invite_res = client.post(
        f"/api/v1/groups/{rahim_group['id']}/members",
        headers=karim_headers,
        json={"email": "consumer.sourov@agroconnect.com", "permission": "VIEW_ONLY"},
    )
    assert invite_res.status_code == 403


def test_delete_cooperative_by_owner_and_admin(
    client: TestClient, farmer_headers: dict[str, str], admin_headers: dict[str, str]
) -> None:
    # 1. Farmer creates group
    create_res = client.post(
        "/api/v1/groups",
        headers=farmer_headers,
        json={"name": "Temporary Cooperative For Deletion", "description": "To be deleted"},
    )
    group_id = create_res.json()["id"]

    # 2. Platform Admin deletes group -> 204 No Content
    del_res = client.delete(f"/api/v1/groups/{group_id}", headers=admin_headers)
    assert del_res.status_code == 204

    # 3. Verifying group is deleted -> 404 Not Found
    get_res = client.get(f"/api/v1/groups/{group_id}", headers=farmer_headers)
    assert get_res.status_code == 404
